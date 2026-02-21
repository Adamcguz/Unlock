import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecurringTaskTemplate, RecurrenceFrequency } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';

interface RecurringTaskState {
  templates: RecurringTaskTemplate[];

  createTemplate: (data: {
    name: string;
    difficulty: number;
    notes: string;
    frequency: RecurrenceFrequency;
    timesPerPeriod: number;
    category?: string;
  }) => RecurringTaskTemplate;

  updateTemplate: (
    templateId: string,
    updates: Partial<Pick<RecurringTaskTemplate, 'name' | 'difficulty' | 'notes' | 'frequency' | 'timesPerPeriod'>>
  ) => void;

  pauseTemplate: (templateId: string) => void;
  resumeTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  markGenerated: (templateId: string, periodId: string) => void;

  reset: () => void;
}

export const useRecurringTaskStore = create<RecurringTaskState>()(
  persist(
    (set) => ({
      templates: [],

      createTemplate: (data) => {
        const template: RecurringTaskTemplate = {
          id: generateId(),
          isActive: true,
          createdAt: new Date().toISOString(),
          lastGeneratedPeriodId: null,
          ...data,
        };
        set((state) => ({ templates: [...state.templates, template] }));
        return template;
      },

      updateTemplate: (templateId, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, ...updates } : t
          ),
        }));
      },

      pauseTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, isActive: false } : t
          ),
        }));
      },

      resumeTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, isActive: true } : t
          ),
        }));
      },

      deleteTemplate: (templateId) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== templateId),
        }));
      },

      markGenerated: (templateId, periodId) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === templateId ? { ...t, lastGeneratedPeriodId: periodId } : t
          ),
        }));
      },

      reset: () => set({ templates: [] }),
    }),
    {
      name: STORAGE_KEYS.RECURRING_TASKS,
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          state.templates = (state.templates as Array<Record<string, unknown>>).map(
            ({ dollarValue: _, ...rest }) => rest
          );
        }
        // v3: category field is optional, no migration needed
        return state as unknown as RecurringTaskState;
      },
    }
  )
);
