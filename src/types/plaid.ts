export interface PlaidAccount {
  accountId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'other';
  currentBalance: number;
  availableBalance: number | null;
}

export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  pending: boolean;
}

export interface PlaidItem {
  id: string;
  institutionName: string | null;
  lastSyncedAt: string | null;
}
