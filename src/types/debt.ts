export type DebtType = 'credit-card' | 'student-loan' | 'other';

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  balance: number;
  minimumPayment: number;
  apr: number;
  createdAt: string;
}
