export type PayPeriodStatus = 'active' | 'completed';

export interface PayPeriod {
  id: string;
  startDate: string;
  endDate: string;
  status: PayPeriodStatus;
  lockedAmount: number;
  unlockedAmount: number;
  expiredAmount: number;
  spentAmount: number;
  taskIds: string[];
}
