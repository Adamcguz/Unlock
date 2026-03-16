import type { Debt, PaySchedule, RecurringBill } from '../types';
import { PAY_SCHEDULE_OPTIONS } from './constants';
import { addDays, getDate, endOfMonth, startOfDay, format } from 'date-fns';

export interface DebtPaydownItem {
  debt: Debt;
  monthlyInterest: number;
  recommendedPayment: number;
  isPriority: boolean;
  monthsToPayoff: number | null;
}

export interface UpcomingEvent {
  date: Date;
  description: string;
  amount: number;
  type: 'bill' | 'deposit';
}

export interface PaydownPlan {
  items: DebtPaydownItem[];
  totalMinimumPayments: number;
  extraPayment: number;
  currentLockPerPeriod: number;
  suggestedLockPerPeriod: number;
  suggestedLockPercentage: number;
  availableAfterUpcoming: number;
  upcomingEvents: UpcomingEvent[];
}

/**
 * Calculates upcoming bills and deposits within the next 30 days.
 */
export function getUpcomingEvents(
  bills: RecurringBill[],
  nextPayDate: string,
  paySchedule: PaySchedule,
  monthlyIncome: number,
  daysAhead: number = 30
): UpcomingEvent[] {
  const events: UpcomingEvent[] = [];
  if (!bills || !Array.isArray(bills)) return events;

  const today = startOfDay(new Date());
  const periodsPerMonth = PAY_SCHEDULE_OPTIONS[paySchedule].periodsPerMonth;
  const incomePerPeriod = Math.round((monthlyIncome / periodsPerMonth) * 100) / 100;

  for (let d = 1; d <= daysAhead; d++) {
    const cursor = addDays(today, d);
    const cursorDay = getDate(cursor);
    const lastDayOfMonth = getDate(endOfMonth(cursor));

    for (const bill of bills) {
      const effectiveDay = Math.min(bill.dayOfMonth, lastDayOfMonth);
      if (cursorDay === effectiveDay) {
        events.push({
          date: cursor,
          description: bill.name,
          amount: bill.amount,
          type: 'bill',
        });
      }
    }
  }

  // Add upcoming pay dates
  let payDate = startOfDay(new Date(nextPayDate));
  const endRange = addDays(today, daysAhead);
  let iterations = 0;
  while (payDate <= endRange && iterations < 10) {
    if (payDate > today) {
      events.push({
        date: payDate,
        description: 'Paycheck',
        amount: incomePerPeriod,
        type: 'deposit',
      });
    }
    // Advance to next pay date
    switch (paySchedule) {
      case 'weekly':
        payDate = addDays(payDate, 7);
        break;
      case 'bi-weekly':
        payDate = addDays(payDate, 14);
        break;
      case 'semi-monthly': {
        const day = getDate(payDate);
        if (day <= 15) {
          payDate = new Date(payDate.getFullYear(), payDate.getMonth(), 16);
        } else {
          payDate = new Date(payDate.getFullYear(), payDate.getMonth() + 1, 1);
        }
        break;
      }
      case 'monthly':
        payDate = new Date(payDate.getFullYear(), payDate.getMonth() + 1, getDate(payDate));
        break;
    }
    payDate = startOfDay(payDate);
    iterations++;
  }

  // Sort by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

/**
 * Generates a debt paydown plan using the avalanche method (highest APR first).
 * Uses the real account balance and upcoming obligations for smarter suggestions.
 */
export function getPaydownPlan(
  debts: Debt[],
  spendingMoney: number,
  lockPercentage: number,
  paySchedule: PaySchedule,
  accountBalance: number,
  bills: RecurringBill[],
  nextPayDate: string,
  monthlyIncome: number
): PaydownPlan {
  const periodsPerMonth = PAY_SCHEDULE_OPTIONS[paySchedule].periodsPerMonth;
  const currentLockPerPeriod = Math.round((spendingMoney * (lockPercentage / 100)) / periodsPerMonth * 100) / 100;

  // Sort by APR descending (avalanche method)
  const sorted = [...debts].sort((a, b) => b.apr - a.apr);

  const totalMinimumPayments = sorted.reduce((sum, d) => sum + d.minimumPayment, 0);

  // Get upcoming events for context
  const upcomingEvents = getUpcomingEvents(bills, nextPayDate, paySchedule, monthlyIncome);

  // Calculate net upcoming obligations in the next 30 days
  const upcomingBills = upcomingEvents
    .filter((e) => e.type === 'bill')
    .reduce((sum, e) => sum + e.amount, 0);
  const upcomingDeposits = upcomingEvents
    .filter((e) => e.type === 'deposit')
    .reduce((sum, e) => sum + e.amount, 0);

  // What's truly available after accounting for upcoming bills and incoming deposits
  const availableAfterUpcoming = Math.max(0, accountBalance - upcomingBills + upcomingDeposits);

  // Monthly unlocked amount = portion NOT locked for spending, available for debt payments
  const monthlyUnlocked = spendingMoney * (1 - lockPercentage / 100);

  // Extra payment = unlocked amount beyond what's needed for minimum debt payments
  const extraPayment = Math.max(0, monthlyUnlocked - totalMinimumPayments);

  // Suggest locking less to free up more for debt payments
  // Target: unlock enough to cover minimums + extra for priority debt
  const targetUnlocked = totalMinimumPayments + extraPayment * 0.5;
  const suggestedLockPercentage = spendingMoney > 0
    ? Math.max(10, Math.min(lockPercentage, Math.round((1 - targetUnlocked / spendingMoney) * 100)))
    : lockPercentage;
  const suggestedLockPerPeriod = Math.round((spendingMoney * (suggestedLockPercentage / 100)) / periodsPerMonth * 100) / 100;

  const items: DebtPaydownItem[] = sorted.map((debt, index) => {
    const monthlyInterest = Math.round((debt.balance * (debt.apr / 100) / 12) * 100) / 100;
    const payment = index === 0
      ? debt.minimumPayment + extraPayment
      : debt.minimumPayment;
    const recommendedPayment = Math.round(payment * 100) / 100;

    let monthsToPayoff: number | null = null;
    if (recommendedPayment > monthlyInterest && debt.balance > 0) {
      const monthlyRate = debt.apr / 100 / 12;
      if (monthlyRate > 0) {
        monthsToPayoff = Math.ceil(
          -Math.log(1 - (monthlyRate * debt.balance) / recommendedPayment) / Math.log(1 + monthlyRate)
        );
        if (!isFinite(monthsToPayoff) || monthsToPayoff < 0) {
          monthsToPayoff = null;
        }
      } else {
        monthsToPayoff = Math.ceil(debt.balance / recommendedPayment);
      }
    }

    return {
      debt,
      monthlyInterest,
      recommendedPayment,
      isPriority: index === 0,
      monthsToPayoff,
    };
  });

  return {
    items,
    totalMinimumPayments,
    extraPayment,
    currentLockPerPeriod,
    suggestedLockPerPeriod,
    suggestedLockPercentage,
    availableAfterUpcoming,
    upcomingEvents,
  };
}
