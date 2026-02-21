import {
  addDays,
  startOfDay,
  endOfDay,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  isSameDay,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDate,
} from 'date-fns';
import type { PaySchedule } from '../types';

/**
 * Given a pay schedule and a known start date, returns the period spanning
 * from that start date forward by one period length.
 * Used for creating the NEXT period after a transition.
 */
export function getNextPeriodDates(
  schedule: PaySchedule,
  referenceDate: Date = new Date()
): { startDate: string; endDate: string } {
  const start = startOfDay(referenceDate);
  let end: Date;

  switch (schedule) {
    case 'weekly':
      end = endOfDay(addDays(start, 6));
      break;
    case 'bi-weekly':
      end = endOfDay(addDays(start, 13));
      break;
    case 'semi-monthly': {
      const dayOfMonth = getDate(start);
      if (dayOfMonth <= 15) {
        end = endOfDay(new Date(start.getFullYear(), start.getMonth(), 15));
      } else {
        end = endOfDay(endOfMonth(start));
      }
      break;
    }
    case 'monthly':
      end = endOfDay(endOfMonth(start));
      break;
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Given a pay schedule and the user's NEXT pay date, calculates the CURRENT
 * period by working backwards.
 *
 * The next pay date is the first day of the next period, so:
 *   - Current period END   = nextPayDate - 1 day
 *   - Current period START = nextPayDate - periodLength
 *
 * Examples (bi-weekly, nextPayDate = Feb 27):
 *   start = Feb 13, end = Feb 26
 */
export function getCurrentPeriodDates(
  schedule: PaySchedule,
  nextPayDate: Date
): { startDate: string; endDate: string } {
  const end = endOfDay(addDays(startOfDay(nextPayDate), -1));
  let start: Date;

  switch (schedule) {
    case 'weekly':
      start = startOfDay(addDays(nextPayDate, -7));
      break;
    case 'bi-weekly':
      start = startOfDay(addDays(nextPayDate, -14));
      break;
    case 'semi-monthly': {
      const dayOfMonth = getDate(nextPayDate);
      if (dayOfMonth <= 15) {
        // Next pay date is in first half → current period was the second half of previous month
        const prevMonth = new Date(nextPayDate.getFullYear(), nextPayDate.getMonth() - 1, 16);
        start = startOfDay(prevMonth);
      } else {
        // Next pay date is in second half → current period was 1st–15th of same month
        start = startOfDay(new Date(nextPayDate.getFullYear(), nextPayDate.getMonth(), 1));
      }
      break;
    }
    case 'monthly':
      start = startOfDay(new Date(nextPayDate.getFullYear(), nextPayDate.getMonth() - 1, getDate(nextPayDate)));
      break;
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function getNextPeriodStartDate(
  _schedule: PaySchedule,
  currentEndDate: string
): Date {
  return startOfDay(addDays(new Date(currentEndDate), 1));
}

export function getDaysRemaining(endDate: string): number {
  return Math.max(0, differenceInCalendarDays(new Date(endDate), new Date()));
}

export function getTotalDaysInPeriod(startDate: string, endDate: string): number {
  return differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
}

export function getPeriodProgress(startDate: string, endDate: string): number {
  const total = getTotalDaysInPeriod(startDate, endDate);
  const elapsed = differenceInCalendarDays(new Date(), new Date(startDate)) + 1;
  return Math.min(1, Math.max(0, elapsed / total));
}

export function isPeriodExpired(endDate: string): boolean {
  return isAfter(new Date(), new Date(endDate));
}

export function isDateInPeriod(date: Date, startDate: string, endDate: string): boolean {
  const d = startOfDay(date);
  return !isBefore(d, startOfDay(new Date(startDate))) &&
    !isAfter(d, endOfDay(new Date(endDate)));
}

export function calculateStreak(completionDates: string[]): { current: number; longest: number } {
  if (completionDates.length === 0) return { current: 0, longest: 0 };

  const uniqueDays = [...new Set(
    completionDates.map(d => format(new Date(d), 'yyyy-MM-dd'))
  )].sort().reverse();

  let current = 0;
  let longest = 0;
  let tempStreak = 1;

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');

  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1;
  }

  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = differenceInCalendarDays(new Date(uniqueDays[i - 1]), new Date(uniqueDays[i]));
    if (diff === 1) {
      tempStreak++;
      if (i <= current || current > 0) {
        current = tempStreak;
      }
    } else {
      longest = Math.max(longest, tempStreak);
      tempStreak = 1;
      if (current > 0 && i > current) {
        break;
      }
    }
  }
  longest = Math.max(longest, tempStreak);
  if (current === 0) current = 0;
  else current = Math.max(current, tempStreak > current ? current : current);

  return { current, longest: Math.max(longest, current) };
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

export function formatShortDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d');
}

export { format, isSameDay, addDays, startOfDay, differenceInCalendarDays };
