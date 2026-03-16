import type { PlaidTransaction } from '../types/plaid';
import type { RecurringBill, PaySchedule } from '../types';

export interface DetectedBill {
  name: string;
  amount: number;
  dayOfMonth: number;
  confidence: number; // 0-1
  occurrences: number;
  merchantName: string;
}

export interface DetectedIncome {
  estimatedMonthlyIncome: number;
  estimatedPerPeriodIncome: number;
  paySchedule: PaySchedule;
  nextPayDate: string;
  confidence: number;
  depositDates: string[];
}

/**
 * Detect recurring bills from Plaid transactions.
 * Looks for repeating charges with similar amounts from the same merchant.
 */
export function detectRecurringBills(transactions: PlaidTransaction[]): DetectedBill[] {
  // Only look at debits (positive amounts in Plaid = money leaving account)
  const debits = transactions.filter((tx) => tx.amount > 0 && !tx.pending);

  // Group by merchant/name
  const grouped = new Map<string, PlaidTransaction[]>();
  for (const tx of debits) {
    const key = (tx.merchantName || tx.name).toLowerCase().trim();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(tx);
  }

  const detected: DetectedBill[] = [];

  for (const [key, txs] of grouped) {
    if (txs.length < 2) continue;

    // Sort by date
    const sorted = txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Check if amounts are similar (within 20% of median)
    const amounts = sorted.map((t) => t.amount);
    const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
    const consistent = amounts.filter((a) => Math.abs(a - median) / median < 0.2);

    if (consistent.length < 2) continue;

    // Check for monthly-ish intervals (25-35 days between charges)
    const dates = sorted.map((t) => new Date(t.date).getTime());
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Accept monthly (25-35 days) or bi-weekly (12-16 days) or weekly (5-9 days)
    const isMonthly = avgInterval >= 25 && avgInterval <= 35;
    const isBiWeekly = avgInterval >= 12 && avgInterval <= 16;
    const isWeekly = avgInterval >= 5 && avgInterval <= 9;

    if (!isMonthly && !isBiWeekly && !isWeekly) continue;

    // Calculate the typical day of month
    const daysOfMonth = sorted.map((t) => new Date(t.date).getDate());
    const avgDay = Math.round(daysOfMonth.reduce((a, b) => a + b, 0) / daysOfMonth.length);

    // Monthly amount: if bi-weekly multiply by ~2.17, if weekly by ~4.33
    let monthlyAmount = median;
    if (isBiWeekly) monthlyAmount = median * 2.17;
    if (isWeekly) monthlyAmount = median * 4.33;

    const confidence = Math.min(1, (consistent.length / amounts.length) * (sorted.length / 3));

    detected.push({
      name: txs[0].merchantName || txs[0].name,
      amount: Math.round(monthlyAmount * 100) / 100,
      dayOfMonth: Math.min(28, avgDay),
      confidence,
      occurrences: sorted.length,
      merchantName: key,
    });
  }

  // Sort by confidence then amount
  return detected.sort((a, b) => b.confidence - a.confidence || b.amount - a.amount);
}

/**
 * Detect income deposits from Plaid transactions.
 * Looks for regular credits (negative amounts in Plaid = money into account) above a threshold.
 */
export function detectIncomeDeposits(transactions: PlaidTransaction[]): DetectedIncome | null {
  // Credits in Plaid are negative amounts
  const credits = transactions.filter(
    (tx) => tx.amount < 0 && !tx.pending && Math.abs(tx.amount) > 200
  );

  if (credits.length < 2) return null;

  // Group by source name
  const grouped = new Map<string, PlaidTransaction[]>();
  for (const tx of credits) {
    const key = (tx.merchantName || tx.name).toLowerCase().trim();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(tx);
  }

  // Find the most likely paycheck source (largest recurring credit)
  let bestSource: { key: string; txs: PlaidTransaction[]; schedule: PaySchedule; interval: number } | null = null;

  for (const [key, txs] of grouped) {
    if (txs.length < 2) continue;

    const sorted = txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = sorted.map((t) => new Date(t.date).getTime());
    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    let schedule: PaySchedule | null = null;
    if (avgInterval >= 5 && avgInterval <= 9) schedule = 'weekly';
    else if (avgInterval >= 12 && avgInterval <= 16) schedule = 'bi-weekly';
    else if (avgInterval >= 13 && avgInterval <= 17) schedule = 'semi-monthly';
    else if (avgInterval >= 25 && avgInterval <= 35) schedule = 'monthly';

    if (!schedule) continue;

    const totalAmount = sorted.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (!bestSource || totalAmount > bestSource.txs.reduce((s, t) => s + Math.abs(t.amount), 0)) {
      bestSource = { key, txs: sorted, schedule, interval: avgInterval };
    }
  }

  if (!bestSource) return null;

  const amounts = bestSource.txs.map((t) => Math.abs(t.amount));
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const perPeriodIncome = Math.round(avgAmount * 100) / 100;

  // Calculate monthly income based on schedule
  let monthlyMultiplier = 1;
  switch (bestSource.schedule) {
    case 'weekly': monthlyMultiplier = 4.33; break;
    case 'bi-weekly': monthlyMultiplier = 2.17; break;
    case 'semi-monthly': monthlyMultiplier = 2; break;
    case 'monthly': monthlyMultiplier = 1; break;
  }

  // Estimate next pay date from the most recent deposit
  const lastDeposit = bestSource.txs[bestSource.txs.length - 1];
  const lastDate = new Date(lastDeposit.date);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + Math.round(bestSource.interval));

  // If the estimated next date is in the past, keep adding intervals
  const now = new Date();
  while (nextDate < now) {
    nextDate.setDate(nextDate.getDate() + Math.round(bestSource.interval));
  }

  const depositDates = bestSource.txs.map((t) => t.date);
  const amountConsistency = amounts.filter(
    (a) => Math.abs(a - avgAmount) / avgAmount < 0.1
  ).length / amounts.length;

  return {
    estimatedMonthlyIncome: Math.round(perPeriodIncome * monthlyMultiplier * 100) / 100,
    estimatedPerPeriodIncome: perPeriodIncome,
    paySchedule: bestSource.schedule,
    nextPayDate: nextDate.toISOString().split('T')[0],
    confidence: Math.min(1, amountConsistency * (bestSource.txs.length / 4)),
    depositDates,
  };
}

/**
 * Convert detected bills into the app's RecurringBill format.
 */
export function detectedBillsToRecurringBills(
  detected: DetectedBill[],
  generateId: () => string
): RecurringBill[] {
  return detected.map((bill) => ({
    id: generateId(),
    name: bill.name,
    amount: bill.amount,
    dayOfMonth: bill.dayOfMonth,
  }));
}
