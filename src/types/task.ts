/** 1 (easiest) through 10 (hardest) */
export type TaskDifficulty = number;
export type TaskStatus = 'active' | 'completed' | 'expired';

export interface Task {
  id: string;
  payPeriodId: string;
  name: string;
  difficulty: TaskDifficulty;
  dollarValue: number;
  status: TaskStatus;
  dueDate: string | null;
  notes: string;
  createdAt: string;
  completedAt: string | null;
  recurringTemplateId?: string;
  category?: string;
  projectId?: string;
}
