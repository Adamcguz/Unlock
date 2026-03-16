import type { PaySchedule, RecurrenceFrequency } from '../types';

export const PAY_SCHEDULE_OPTIONS: Record<PaySchedule, { label: string; periodsPerMonth: number }> = {
  'weekly': { label: 'Weekly', periodsPerMonth: 4 },
  'bi-weekly': { label: 'Bi-weekly', periodsPerMonth: 2 },
  'semi-monthly': { label: 'Semi-monthly', periodsPerMonth: 2 },
  'monthly': { label: 'Monthly', periodsPerMonth: 1 },
};

export const COMMON_BILL_PRESETS = [
  'Rent / Mortgage',
  'Car Payment',
  'Insurance',
  'Electric',
  'Water',
  'Internet',
  'Phone',
  'Streaming',
  'Gym',
  'Student Loan',
];

export const DEFAULT_LOCK_PERCENTAGE = 50;

export const DEFAULT_TASK_CATEGORIES = [
  'Health & Fitness',
  'Work',
  'Learning',
  'Household',
  'Finance',
  'Social',
  'Creative',
  'Self-Care',
];

export const STORAGE_KEYS = {
  USER_PROFILE: 'unlock_user_profile',
  TASKS: 'unlock_tasks',
  PAY_PERIODS: 'unlock_pay_periods',
  HISTORY: 'unlock_history',
  RECURRING_TASKS: 'unlock_recurring_tasks',
  PROJECTS: 'unlock_projects',
  GOALS: 'unlock_goals',
  DEBTS: 'unlock_debts',
} as const;

export const GOAL_UNIT_PRESETS = [
  'lbs', 'kg', '$', 'pages', 'miles', 'km', 'minutes', 'hours', 'reps', 'days',
];

export const MOTIVATING_MESSAGES = [
  "You earned it!",
  "Money unlocked!",
  "Great work!",
  "Keep it up!",
  "You're on fire!",
  "Well deserved!",
  "Crushing it!",
  "Way to go!",
  "Unstoppable!",
  "That's how it's done!",
];

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'every-period', label: 'Every pay period' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

/**
 * Returns a label for a numeric difficulty (1-10).
 */
export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 2) return 'Easy';
  if (difficulty <= 4) return 'Moderate';
  if (difficulty <= 6) return 'Medium';
  if (difficulty <= 8) return 'Hard';
  return 'Extreme';
}

/**
 * Returns Tailwind classes for a numeric difficulty (1-10).
 * Gradient from green (1) → blue (4) → orange (7) → red (10).
 */
export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 2) return 'bg-green-500/20 text-green-400';
  if (difficulty <= 4) return 'bg-blue-500/20 text-blue-400';
  if (difficulty <= 6) return 'bg-yellow-500/20 text-yellow-400';
  if (difficulty <= 8) return 'bg-orange-500/20 text-orange-400';
  return 'bg-red-500/20 text-red-400';
}
