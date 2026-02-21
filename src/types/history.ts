export interface HistoryEntry {
  id: string;
  taskId: string;
  taskName: string;
  difficulty: number;
  dollarValue: number;
  completedAt: string;
  payPeriodId: string;
  type: 'unlocked' | 'saved';
}

export interface PeriodSummary {
  payPeriodId: string;
  startDate: string;
  endDate: string;
  totalLocked: number;
  totalUnlocked: number;
  totalSaved: number;
  tasksCompleted: number;
  tasksExpired: number;
  tasksTotal: number;
}

export interface AllTimeStats {
  totalUnlocked: number;
  totalSaved: number;
  totalTasksCompleted: number;
  longestStreak: number;
  currentStreak: number;
  periodsCompleted: number;
}
