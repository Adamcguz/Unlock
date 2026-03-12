export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number; // 1-31
}

export type PaySchedule = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';

export interface UserProfile {
  id: string;
  createdAt: string;
  monthlyIncome: number;
  bills: RecurringBill[];
  paySchedule: PaySchedule;
  nextPayDate: string;
  lockPercentage: number;
  onboardingCompleted: boolean;
  taskCategories: string[];
}
