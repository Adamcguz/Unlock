import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PayPeriod } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';

interface PayPeriodState {
  periods: PayPeriod[];
  currentPeriodId: string | null;
  createPeriod: (startDate: string, endDate: string, lockedAmount: number) => PayPeriod;
  completePeriod: (periodId: string, expiredAmount: number) => void;
  updatePeriodUnlocked: (periodId: string, amount: number) => void;
  addTaskToPeriod: (periodId: string, taskId: string) => void;
  removeTaskFromPeriod: (periodId: string, taskId: string) => void;
  updatePeriodDates: (periodId: string, startDate: string, endDate: string) => void;
  getCurrentPeriod: () => PayPeriod | null;
  reset: () => void;
}

export const usePayPeriodStore = create<PayPeriodState>()(
  persist(
    (set, get) => ({
      periods: [],
      currentPeriodId: null,

      createPeriod: (startDate, endDate, lockedAmount) => {
        const period: PayPeriod = {
          id: generateId(),
          startDate,
          endDate,
          status: 'active',
          lockedAmount,
          unlockedAmount: 0,
          expiredAmount: 0,
          taskIds: [],
        };
        set((state) => ({
          periods: [...state.periods, period],
          currentPeriodId: period.id,
        }));
        return period;
      },

      completePeriod: (periodId, expiredAmount) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId
              ? { ...p, status: 'completed' as const, expiredAmount }
              : p
          ),
          currentPeriodId:
            state.currentPeriodId === periodId ? null : state.currentPeriodId,
        }));
      },

      updatePeriodUnlocked: (periodId, amount) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId
              ? { ...p, unlockedAmount: p.unlockedAmount + amount }
              : p
          ),
        }));
      },

      addTaskToPeriod: (periodId, taskId) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId
              ? { ...p, taskIds: [...p.taskIds, taskId] }
              : p
          ),
        }));
      },

      removeTaskFromPeriod: (periodId, taskId) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId
              ? { ...p, taskIds: p.taskIds.filter((id) => id !== taskId) }
              : p
          ),
        }));
      },

      updatePeriodDates: (periodId, startDate, endDate) => {
        set((state) => ({
          periods: state.periods.map((p) =>
            p.id === periodId ? { ...p, startDate, endDate } : p
          ),
        }));
      },

      getCurrentPeriod: () => {
        const { periods, currentPeriodId } = get();
        return periods.find((p) => p.id === currentPeriodId) ?? null;
      },

      reset: () => set({ periods: [], currentPeriodId: null }),
    }),
    {
      name: STORAGE_KEYS.PAY_PERIODS,
      version: 1,
    }
  )
);
