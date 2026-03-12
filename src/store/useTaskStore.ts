import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskDifficulty } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';

interface TaskState {
  tasks: Task[];
  createTask: (data: {
    payPeriodId: string;
    name: string;
    difficulty: TaskDifficulty;
    dueDate: string | null;
    notes: string;
    recurringTemplateId?: string;
    category?: string;
    projectId?: string;
  }) => Task;
  completeTask: (taskId: string, computedValue: number) => void;
  expireTasksForPeriod: (payPeriodId: string) => Task[];
  updateTask: (taskId: string, updates: Partial<Pick<Task, 'name' | 'difficulty' | 'dueDate' | 'notes' | 'category'>>) => void;
  deleteTask: (taskId: string) => void;
  getTasksByPeriod: (payPeriodId: string) => Task[];
  getActiveTasksByPeriod: (payPeriodId: string) => Task[];
  reset: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      createTask: (data) => {
        const task: Task = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          completedAt: null,
          status: 'active',
          dollarValue: 0,
          ...data,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      },

      completeTask: (taskId, computedValue) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString(), dollarValue: computedValue }
              : t
          ),
        }));
      },

      expireTasksForPeriod: (payPeriodId) => {
        const expired: Task[] = [];
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.payPeriodId === payPeriodId && t.status === 'active') {
              const expiredTask = { ...t, status: 'expired' as const };
              expired.push(expiredTask);
              return expiredTask;
            }
            return t;
          }),
        }));
        return expired;
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      getTasksByPeriod: (payPeriodId) => {
        return get().tasks.filter((t) => t.payPeriodId === payPeriodId);
      },

      getActiveTasksByPeriod: (payPeriodId) => {
        return get().tasks.filter(
          (t) => t.payPeriodId === payPeriodId && t.status === 'active'
        );
      },

      reset: () => set({ tasks: [] }),
    }),
    {
      name: STORAGE_KEYS.TASKS,
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          state.tasks = (state.tasks as Array<Record<string, unknown>>).map((t) =>
            t.status === 'active' ? { ...t, dollarValue: 0 } : t
          );
        }
        // v3: category field is optional, no migration needed
        return state as unknown as TaskState;
      },
    }
  )
);
