import type { RecurringBill, PaySchedule, RecurrenceFrequency } from '../types';
import { PAY_SCHEDULE_OPTIONS } from './constants';
import { getDate, endOfMonth } from 'date-fns';

export function calculateTotalBills(bills: RecurringBill[]): number {
  return bills.reduce((sum, bill) => sum + bill.amount, 0);
}

export function calculateSpendingMoney(income: number, bills: RecurringBill[]): number {
  return Math.max(0, income - calculateTotalBills(bills));
}

/**
 * Sums all bills whose dayOfMonth falls within a pay period's date range.
 * Handles periods that cross month boundaries and clamps day 29-31 bills
 * to the last day of shorter months.
 */
export function calculateBillsInPeriod(
  bills: RecurringBill[],
  periodStart: Date,
  periodEnd: Date
): number {
  let total = 0;
  let m = periodStart.getMonth();
  let y = periodStart.getFullYear();
  const endMonth = periodEnd.getMonth();
  const endYear = periodEnd.getFullYear();

  while (y < endYear || (y === endYear && m <= endMonth)) {
    const lastDayOfMonth = getDate(endOfMonth(new Date(y, m)));

    for (const bill of bills) {
      const effectiveDay = Math.min(bill.dayOfMonth, lastDayOfMonth);
      const billDate = new Date(y, m, effectiveDay);

      if (billDate >= periodStart && billDate <= periodEnd) {
        total += bill.amount;
      }
    }

    m++;
    if (m > 11) { m = 0; y++; }
  }

  return total;
}

/**
 * Calculates the locked amount for a specific pay period based on which
 * bills actually fall within it.
 */
export function calculateLockedAmountForPeriod(
  monthlyIncome: number,
  bills: RecurringBill[],
  lockPercentage: number,
  paySchedule: PaySchedule,
  periodStart: Date,
  periodEnd: Date
): number {
  const periodsPerMonth = PAY_SCHEDULE_OPTIONS[paySchedule].periodsPerMonth;
  const periodIncome = monthlyIncome / periodsPerMonth;
  const periodExpenses = calculateBillsInPeriod(bills, periodStart, periodEnd);
  const periodSpending = Math.max(0, periodIncome - periodExpenses);
  return Math.round(periodSpending * (lockPercentage / 100) * 100) / 100;
}

/**
 * Average locked amount per period (used in onboarding preview before
 * concrete period dates exist).
 */
export function calculateLockedAmountPerPeriod(
  spendingMoney: number,
  lockPercentage: number,
  paySchedule: PaySchedule
): number {
  const periodsPerMonth = PAY_SCHEDULE_OPTIONS[paySchedule].periodsPerMonth;
  return Math.round((spendingMoney * (lockPercentage / 100)) / periodsPerMonth * 100) / 100;
}

/**
 * Returns the exponential difficulty weight for a 1-10 difficulty.
 * d=1: 2.0, d=5: ~7.25, d=10: ~50.3
 */
export function calculateDifficultyWeight(difficulty: number): number {
  return 2 * Math.pow(1.38, difficulty - 1);
}

function normalCDF(x: number, mean: number, stddev: number): number {
  const z = (x - mean) / stddev;
  return 1 / (1 + Math.exp(-1.7 * z));
}

/**
 * Returns the maximum percentage of the locked budget that a task group
 * of the given difficulty can be worth.
 */
export function getMaxTaskPercent(difficulty: number): number {
  const MIN_CAP = 0.015;
  const MAX_CAP = 0.40;
  const cdf = normalCDF(difficulty, 5, 2.5);
  return MIN_CAP + (MAX_CAP - MIN_CAP) * cdf;
}

/**
 * Returns the total expected completions for a recurring task over a pay period.
 */
export function getExpectedCompletions(
  frequency: RecurrenceFrequency,
  timesPerPeriod: number,
  periodDays: number
): number {
  switch (frequency) {
    case 'daily':
      return timesPerPeriod * periodDays;
    case 'weekly':
      return timesPerPeriod * Math.max(1, Math.round(periodDays / 7));
    case 'monthly':
      return timesPerPeriod * Math.max(1, Math.round(periodDays / 30));
    case 'every-period':
    default:
      return timesPerPeriod;
  }
}

/**
 * Computes the dollar value for every active task using group-based allocation.
 */
export function calculateTaskValues(
  activeTasks: Array<{ id: string; difficulty: number; recurringTemplateId?: string }>,
  remainingBudget: number,
  lockedAmount: number,
  expectedCompletions?: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  if (activeTasks.length === 0 || remainingBudget <= 0) return result;

  const groups = new Map<string, Array<{ id: string; difficulty: number }>>();
  for (const task of activeTasks) {
    const groupKey = task.recurringTemplateId ?? task.id;
    const group = groups.get(groupKey);
    if (group) {
      group.push(task);
    } else {
      groups.set(groupKey, [task]);
    }
  }

  const groupData = Array.from(groups.entries()).map(([key, tasks]) => ({
    key,
    tasks,
    difficulty: tasks[0].difficulty,
    weight: calculateDifficultyWeight(tasks[0].difficulty),
    cap: Math.round(getMaxTaskPercent(tasks[0].difficulty) * lockedAmount * 100) / 100,
  }));
  const totalWeight = groupData.reduce((sum, g) => sum + g.weight, 0);

  for (const { key, tasks, weight, cap } of groupData) {
    const proportional = Math.round((weight / totalWeight) * remainingBudget * 100) / 100;
    const groupValue = Math.min(proportional, cap);
    const divisor = expectedCompletions?.get(key) ?? tasks.length;
    const perTask = Math.round((groupValue / divisor) * 100) / 100;
    for (const task of tasks) {
      result.set(task.id, perTask);
    }
  }

  return result;
}
