import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry, PeriodSummary, AllTimeStats } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';
import { calculateStreak } from '../lib/dateUtils';

interface HistoryState {
  entries: HistoryEntry[];
  periodSummaries: PeriodSummary[];
  addEntry: (data: Omit<HistoryEntry, 'id'>) => void;
  addPeriodSummary: (summary: PeriodSummary) => void;
  getAllTimeStats: () => AllTimeStats;
  getEntriesByPeriod: (periodId: string) => HistoryEntry[];
  getCompletionDates: () => string[];
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      periodSummaries: [],

      addEntry: (data) => {
        const entry: HistoryEntry = {
          id: generateId(),
          ...data,
        };
        set((state) => ({ entries: [...state.entries, entry] }));
      },

      addPeriodSummary: (summary) => {
        set((state) => ({
          periodSummaries: [...state.periodSummaries, summary],
        }));
      },

      getAllTimeStats: () => {
        const { entries, periodSummaries } = get();
        const unlocked = entries
          .filter((e) => e.type === 'unlocked')
          .reduce((sum, e) => sum + e.dollarValue, 0);
        const saved = entries
          .filter((e) => e.type === 'saved')
          .reduce((sum, e) => sum + e.dollarValue, 0);
        const completionDates = entries
          .filter((e) => e.type === 'unlocked')
          .map((e) => e.completedAt);
        const streak = calculateStreak(completionDates);

        return {
          totalUnlocked: unlocked,
          totalSaved: saved,
          totalTasksCompleted: entries.filter((e) => e.type === 'unlocked').length,
          longestStreak: streak.longest,
          currentStreak: streak.current,
          periodsCompleted: periodSummaries.length,
        };
      },

      getEntriesByPeriod: (periodId) => {
        return get().entries.filter((e) => e.payPeriodId === periodId);
      },

      getCompletionDates: () => {
        return get()
          .entries.filter((e) => e.type === 'unlocked')
          .map((e) => e.completedAt);
      },

      reset: () => set({ entries: [], periodSummaries: [] }),
    }),
    {
      name: STORAGE_KEYS.HISTORY,
      version: 1,
    }
  )
);
