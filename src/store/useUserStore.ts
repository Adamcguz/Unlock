import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, RecurringBill, PaySchedule } from '../types';
import { STORAGE_KEYS, DEFAULT_TASK_CATEGORIES } from '../lib/constants';
import { generateId } from '../lib/storage';
import { calculateSpendingMoney, calculateLockedAmountPerPeriod, calculateLockedAmountForPeriod, calculateLockedAmountFromBalance } from '../lib/calculations';

interface UserState {
  profile: UserProfile | null;
  createProfile: (data: {
    monthlyIncome: number;
    bills: RecurringBill[];
    paySchedule: PaySchedule;
    nextPayDate: string;
    lockPercentage: number;
    taskCategories: string[];
  }) => UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getSpendingMoney: () => number;
  getLockedAmountPerPeriod: () => number;
  getLockedAmountForPeriod: (periodStart: Date, periodEnd: Date) => number;
  getLockedAmountFromBalance: (accountBalance: number, upcomingBills: number) => number;
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
        return calculateSpendingMoney(profile.monthlyIncome, profile.bills);
      },

      getLockedAmountPerPeriod: () => {
        const profile = get().profile;
        if (!profile) return 0;
        const spendingMoney = calculateSpendingMoney(profile.monthlyIncome, profile.bills);
        return calculateLockedAmountPerPeriod(spendingMoney, profile.lockPercentage, profile.paySchedule);
      },

      getLockedAmountForPeriod: (periodStart, periodEnd) => {
        const profile = get().profile;
        if (!profile) return 0;
        return calculateLockedAmountForPeriod(
          profile.monthlyIncome,
          profile.bills,
          profile.lockPercentage,
          profile.paySchedule,
          periodStart,
          periodEnd
        );
      },

      getLockedAmountFromBalance: (accountBalance, upcomingBills) => {
        const profile = get().profile;
        if (!profile) return 0;
        return calculateLockedAmountFromBalance(accountBalance, upcomingBills, profile.lockPercentage);
      },

      reset: () => set({ profile: null }),
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE,
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2 && state.profile) {
          const profile = state.profile as Record<string, unknown>;
          if (!profile.taskCategories) {
            profile.taskCategories = DEFAULT_TASK_CATEGORIES;
          }
        }
        if (version < 3 && state.profile) {
          const profile = state.profile as Record<string, unknown>;
          const expenses = profile.expenses as Record<string, number> | undefined;
          if (expenses) {
            const categoryLabels: Record<string, string> = {
              rent: 'Rent / Mortgage',
              groceries: 'Groceries',
              utilities: 'Utilities',
              subscriptions: 'Subscriptions',
              transportation: 'Transportation',
              savings: 'Savings',
              other: 'Other',
            };
            const bills: RecurringBill[] = [];
            let day = 1;
            for (const [key, amount] of Object.entries(expenses)) {
              if (amount > 0) {
                bills.push({
                  id: generateId(),
                  name: categoryLabels[key] ?? key,
                  amount,
                  dayOfMonth: day,
                });
                day = Math.min(28, day + 4);
              }
            }
            profile.bills = bills;
            delete profile.expenses;
          }
        }
        return state as unknown as UserState;
      },
    }
  )
);
