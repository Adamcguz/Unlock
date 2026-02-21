export type RecurrenceFrequency = 'every-period' | 'daily' | 'weekly' | 'monthly';

export interface RecurringTaskTemplate {
  id: string;
  name: string;
  difficulty: number;
  notes: string;
  frequency: RecurrenceFrequency;
  timesPerPeriod: number;
  isActive: boolean;
  createdAt: string;
  lastGeneratedPeriodId: string | null;
  category?: string;
}
