export interface ExpenseBreakdown {
  rent: number;
  groceries: number;
  utilities: number;
  subscriptions: number;
  transportation: number;
  savings: number;
  other: number;
}

export type PaySchedule = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

export interface UserProfile {
  id: string;
  createdAt: string;
  monthlyIncome: number;
  expenses: ExpenseBreakdown;
  paySchedule: PaySchedule;
  nextPayDate: string;
  lockPercentage: number;
  onboardingCompleted: boolean;
  taskCategories: string[];
}
