import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlaidAccount, PlaidTransaction } from '../types/plaid';
import type { DetectedBill, DetectedIncome } from '../lib/transactionDetection';

interface PlaidState {
  isConnected: boolean;
  institutionName: string | null;
  itemId: string | null;
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  lastSyncedAt: string | null;
  isSyncing: boolean;
  error: string | null;

  // Detected patterns
  detectedBills: DetectedBill[];
  detectedIncome: DetectedIncome | null;
  billsImported: boolean;
  incomeImported: boolean;

  setConnected: (connected: boolean, institutionName?: string, itemId?: string) => void;
  setAccounts: (accounts: PlaidAccount[]) => void;
  setTransactions: (transactions: PlaidTransaction[]) => void;
  setSyncing: (syncing: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncedAt: (date: string) => void;
  setDetectedBills: (bills: DetectedBill[]) => void;
  setDetectedIncome: (income: DetectedIncome | null) => void;
  setBillsImported: (imported: boolean) => void;
  setIncomeImported: (imported: boolean) => void;
  disconnect: () => void;
}

export const usePlaidStore = create<PlaidState>()(
  persist(
    (set) => ({
      isConnected: false,
      institutionName: null,
      itemId: null,
      accounts: [],
      transactions: [],
      lastSyncedAt: null,
      isSyncing: false,
      error: null,
      detectedBills: [],
      detectedIncome: null,
      billsImported: false,
      incomeImported: false,

      setConnected: (connected, institutionName, itemId) =>
        set({ isConnected: connected, institutionName: institutionName ?? null, itemId: itemId ?? null }),

      setAccounts: (accounts) => set({ accounts }),

      setTransactions: (transactions) => set({ transactions }),

      setSyncing: (syncing) => set({ isSyncing: syncing }),

      setError: (error) => set({ error }),

      setLastSyncedAt: (date) => set({ lastSyncedAt: date }),

      setDetectedBills: (bills) => set({ detectedBills: bills }),

      setDetectedIncome: (income) => set({ detectedIncome: income }),

      setBillsImported: (imported) => set({ billsImported: imported }),

      setIncomeImported: (imported) => set({ incomeImported: imported }),

      disconnect: () =>
        set({
          isConnected: false,
          institutionName: null,
          itemId: null,
          accounts: [],
          transactions: [],
          lastSyncedAt: null,
          error: null,
          detectedBills: [],
          detectedIncome: null,
          billsImported: false,
          incomeImported: false,
        }),
    }),
    {
      name: 'unlock_plaid',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          state.detectedBills = [];
          state.detectedIncome = null;
          state.billsImported = false;
          state.incomeImported = false;
        }
        return state as unknown as PlaidState;
      },
    }
  )
);
