import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, ExpenseBreakdown, PaySchedule } from '../types';
import { STORAGE_KEYS, DEFAULT_TASK_CATEGORIES } from '../lib/constants';
import { generateId } from '../lib/storage';
import { calculateSpendingMoney, calculateLockedAmountPerPeriod } from '../lib/calculations';

interface UserState {
  profile: UserProfile | null;
  createProfile: (data: {
    monthlyIncome: number;
    expenses: ExpenseBreakdown;
    paySchedule: PaySchedule;
    nextPayDate: string;
    lockPercentage: number;
    taskCategories: string[];
  }) => UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getSpendingMoney: () => number;
  getLockedAmountPerPeriod: () => number;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,

      createProfile: (data) => {
        const profile: UserProfile = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          onboardingCompleted: true,
          ...data,
        };
        set({ profile });
        return profile;
      },

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) return;
        set({ profile: { ...current, ...updates } });
      },

      getSpendingMoney: () => {
        const profile = get().profile;
        if (!profile) return 0;
        return calculateSpendingMoney(profile.monthlyIncome, profile.expenses);
      },

      getLockedAmountPerPeriod: () => {
        const profile = get().profile;
        if (!profile) return 0;
        const spendingMoney = calculateSpendingMoney(profile.monthlyIncome, profile.expenses);
        return calculateLockedAmountPerPeriod(spendingMoney, profile.lockPercentage, profile.paySchedule);
      },

      reset: () => set({ profile: null }),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE,
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2 && state.profile) {
          const profile = state.profile as Record<string, unknown>;
          if (!profile.taskCategories) {
            profile.taskCategories = DEFAULT_TASK_CATEGORIES;
          }
        }
        return state as unknown as UserState;
      },
    }
  )
);
