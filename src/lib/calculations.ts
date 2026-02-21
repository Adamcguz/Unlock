import type { ExpenseBreakdown, PaySchedule } from '../types';
import { PAY_SCHEDULE_OPTIONS } from './constants';

export function calculateTotalExpenses(expenses: ExpenseBreakdown): number {
  return Object.values(expenses).reduce((sum, val) => sum + val, 0);
}

export function calculateSpendingMoney(income: number, expenses: ExpenseBreakdown): number {
  return Math.max(0, income - calculateTotalExpenses(expenses));
}

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

/**
 * Approximate normal CDF using a logistic function.
 * Returns a value between 0 and 1.
 */
function normalCDF(x: number, mean: number, stddev: number): number {
  const z = (x - mean) / stddev;
  return 1 / (1 + Math.exp(-1.7 * z));
}

/**
 * Returns the maximum percentage of the locked amount that a single task
 * of the given difficulty can be worth.
 *
 * Uses a smooth S-curve (approximated normal CDF) shifted right so easy
 * tasks are worth little and harder tasks unlock more:
 *   d=1  → ~1.5%     d=6  → ~9%
 *   d=2  → ~2%       d=7  → ~12%
 *   d=3  → ~3.5%     d=8  → ~15%
 *   d=4  → ~5%       d=9  → ~17%
 *   d=5  → ~7%       d=10 → ~20%
 */
export function getMaxTaskPercent(difficulty: number): number {
  const MIN_CAP = 0.015;
  const MAX_CAP = 0.20;
  const cdf = normalCDF(difficulty, 5, 2.5);
  return MIN_CAP + (MAX_CAP - MIN_CAP) * cdf;
}

/**
 * Computes the dollar value for every active task.
 *
 * Each task gets a proportional share of the remaining budget weighted by
 * difficulty, but clamped to a per-task cap based on an S-curve of difficulty.
 * Any budget that exceeds all caps simply remains unallocated (becomes savings
 * if unclaimed by period end).
 */
export function calculateTaskValues(
  activeTasks: Array<{ id: string; difficulty: number }>,
  remainingBudget: number,
  lockedAmount: number
): Map<string, number> {
  const result = new Map<string, number>();
  if (activeTasks.length === 0 || remainingBudget <= 0) return result;

  const weights = activeTasks.map((t) => ({
    id: t.id,
    difficulty: t.difficulty,
    weight: calculateDifficultyWeight(t.difficulty),
    cap: Math.round(getMaxTaskPercent(t.difficulty) * lockedAmount * 100) / 100,
  }));
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  for (const { id, weight, cap } of weights) {
    const proportional = Math.round((weight / totalWeight) * remainingBudget * 100) / 100;
    result.set(id, Math.min(proportional, cap));
  }

  return result;
}
