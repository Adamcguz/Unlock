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
 * Returns the maximum percentage of the locked budget that a task group
 * of the given difficulty can be worth.
 *
 * Uses a smooth S-curve (approximated normal CDF) shifted right so easy
 * tasks are worth little and harder tasks unlock more:
 *   d=1  → ~2.7%     d=6  → ~17%
 *   d=2  → ~4.5%     d=7  → ~23%
 *   d=3  → ~7%       d=8  → ~28%
 *   d=4  → ~10%      d=9  → ~33%
 *   d=5  → ~13%      d=10 → ~38%
 */
export function getMaxTaskPercent(difficulty: number): number {
  const MIN_CAP = 0.015;
  const MAX_CAP = 0.40;
  const cdf = normalCDF(difficulty, 5, 2.5);
  return MIN_CAP + (MAX_CAP - MIN_CAP) * cdf;
}

/**
 * Computes the dollar value for every active task using group-based allocation.
 *
 * Tasks sharing a recurringTemplateId are grouped together. Each group gets
 * ONE weight and ONE cap regardless of how many instances exist. The group's
 * allocation is then divided evenly among its active instances.
 *
 * This prevents recurring tasks with many instances (e.g. "brush teeth" 2x/day)
 * from collectively claiming most of the budget. A d=1 task repeated 28 times
 * gets the same total allocation as a single d=1 task — the per-instance value
 * is just smaller.
 *
 * Any budget that exceeds all caps remains unallocated (becomes savings if
 * unclaimed by period end).
 */
export function calculateTaskValues(
  activeTasks: Array<{ id: string; difficulty: number; recurringTemplateId?: string }>,
  remainingBudget: number,
  lockedAmount: number
): Map<string, number> {
  const result = new Map<string, number>();
  if (activeTasks.length === 0 || remainingBudget <= 0) return result;

  // Group tasks by recurringTemplateId (non-recurring tasks form solo groups)
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

  // Compute one weight and one cap per group
  const groupData = Array.from(groups.entries()).map(([key, tasks]) => ({
    key,
    tasks,
    difficulty: tasks[0].difficulty,
    weight: calculateDifficultyWeight(tasks[0].difficulty),
    cap: Math.round(getMaxTaskPercent(tasks[0].difficulty) * lockedAmount * 100) / 100,
  }));
  const totalWeight = groupData.reduce((sum, g) => sum + g.weight, 0);

  // Allocate proportional share per group, capped, then divide among instances
  for (const { tasks, weight, cap } of groupData) {
    const proportional = Math.round((weight / totalWeight) * remainingBudget * 100) / 100;
    const groupValue = Math.min(proportional, cap);
    const perTask = Math.round((groupValue / tasks.length) * 100) / 100;
    for (const task of tasks) {
      result.set(task.id, perTask);
    }
  }

  return result;
}
