import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { differenceInCalendarDays } from 'date-fns';
import type { Goal, GoalCheckIn, GoalLink, GoalType } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';

interface GoalState {
  goals: Goal[];
  checkIns: GoalCheckIn[];
  lastWeeklyPromptAt: string | null;

  createGoal: (data: {
    name: string;
    type: GoalType;
    link: GoalLink;
    startValue?: number;
    targetValue?: number;
    unit?: string;
  }) => Goal;
  updateGoal: (id: string, updates: Partial<Pick<Goal, 'name' | 'unit' | 'targetValue' | 'link' | 'status'>>) => void;
  deleteGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  archiveGoal: (id: string) => void;

  addCheckIn: (goalId: string, value: number, note?: string) => GoalCheckIn;
  getCheckInsForGoal: (goalId: string) => GoalCheckIn[];
  getGoalsNeedingCheckIn: () => Goal[];
  setLastWeeklyPromptAt: (date: string) => void;

  reset: () => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      checkIns: [],
      lastWeeklyPromptAt: null,

      createGoal: (data) => {
        const isNumeric = data.type === 'numeric';
        const start = isNumeric ? (data.startValue ?? 0) : null;
        const target = isNumeric ? (data.targetValue ?? 0) : null;
        let direction: Goal['direction'] = null;
        if (start !== null && target !== null) {
          direction = target >= start ? 'increase' : 'decrease';
        }

        const goal: Goal = {
          id: generateId(),
          name: data.name,
          type: data.type,
          status: 'active',
          link: data.link,
          createdAt: new Date().toISOString(),
          completedAt: null,
          startValue: start,
          targetValue: target,
          currentValue: start,
          unit: isNumeric ? (data.unit ?? null) : null,
          direction,
          lastCheckInAt: null,
        };
        set((state) => ({ goals: [...state.goals, goal] }));
        return goal;
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
          checkIns: state.checkIns.filter((c) => c.goalId !== id),
        }));
      },

      completeGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: 'completed' as const, completedAt: new Date().toISOString() } : g
          ),
        }));
      },

      archiveGoal: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, status: 'archived' as const } : g
          ),
        }));
      },

      addCheckIn: (goalId, value, note) => {
        const now = new Date().toISOString();
        const checkIn: GoalCheckIn = {
          id: generateId(),
          goalId,
          value,
          note,
          createdAt: now,
        };

        set((state) => {
          const updatedGoals = state.goals.map((g) => {
            if (g.id !== goalId) return g;
            const updated = { ...g, currentValue: value, lastCheckInAt: now };
            // Auto-complete if target reached
            if (
              g.targetValue !== null &&
              ((g.direction === 'decrease' && value <= g.targetValue) ||
               (g.direction === 'increase' && value >= g.targetValue))
            ) {
              updated.status = 'completed';
              updated.completedAt = now;
            }
            return updated;
          });
          return {
            goals: updatedGoals,
            checkIns: [...state.checkIns, checkIn],
          };
        });

        return checkIn;
      },

      getCheckInsForGoal: (goalId) => {
        return get().checkIns.filter((c) => c.goalId === goalId);
      },

      getGoalsNeedingCheckIn: () => {
        const now = new Date();
        return get().goals.filter((g) => {
          if (g.type !== 'numeric' || g.status !== 'active') return false;
          if (!g.lastCheckInAt) return true;
          return differenceInCalendarDays(now, new Date(g.lastCheckInAt)) >= 7;
        });
      },

      setLastWeeklyPromptAt: (date) => {
        set({ lastWeeklyPromptAt: date });
      },

      reset: () => set({ goals: [], checkIns: [], lastWeeklyPromptAt: null }),
    }),
    {
      name: STORAGE_KEYS.GOALS,
      version: 1,
    }
  )
);
