import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Debt, DebtType } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';

export type BalanceTransactionType = 'bill' | 'deposit' | 'spending';

export interface BalanceTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: BalanceTransactionType;
}

interface DebtState {
  debts: Debt[];
  accountBalance: number;
  transactions: BalanceTransaction[];
  lastProcessedDate: string | null;
  addDebt: (data: {
    name: string;
    type: DebtType;
    balance: number;
    minimumPayment: number;
    apr: number;
    plaidAccountId?: string;
  }) => Debt;
  updateDebt: (debtId: string, updates: Partial<Omit<Debt, 'id' | 'createdAt'>>) => void;
  removeDebt: (debtId: string) => void;
  setAccountBalance: (amount: number) => void;
  deductFromBalance: (amount: number, description: string, type: BalanceTransactionType) => void;
  creditToBalance: (amount: number, description: string, type: BalanceTransactionType) => void;
  setLastProcessedDate: (date: string) => void;
  reset: () => void;
}

const MAX_TRANSACTIONS = 50;

export const useDebtStore = create<DebtState>()(
  persist(
    (set) => ({
      debts: [],
      accountBalance: 0,
      transactions: [],
      lastProcessedDate: null,

      addDebt: (data) => {
        const debt: Debt = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          ...data,
        };
        set((state) => ({ debts: [...state.debts, debt] }));
        return debt;
      },

      updateDebt: (debtId, updates) => {
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === debtId ? { ...d, ...updates } : d
          ),
        }));
      },

      removeDebt: (debtId) => {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== debtId),
        }));
      },

      setAccountBalance: (amount) => {
        set({ accountBalance: amount });
      },

      deductFromBalance: (amount, description, type) => {
        const tx: BalanceTransaction = {
          id: generateId(),
          date: new Date().toISOString(),
          description,
          amount: -amount,
          type,
        };
        set((state) => ({
          accountBalance: Math.round((state.accountBalance - amount) * 100) / 100,
          transactions: [tx, ...state.transactions].slice(0, MAX_TRANSACTIONS),
        }));
      },

      creditToBalance: (amount, description, type) => {
        const tx: BalanceTransaction = {
          id: generateId(),
          date: new Date().toISOString(),
          description,
          amount,
          type,
        };
        set((state) => ({
          accountBalance: Math.round((state.accountBalance + amount) * 100) / 100,
          transactions: [tx, ...state.transactions].slice(0, MAX_TRANSACTIONS),
        }));
      },

      setLastProcessedDate: (date) => {
        set({ lastProcessedDate: date });
      },

      reset: () => set({ debts: [], accountBalance: 0, transactions: [], lastProcessedDate: null }),
    }),
    {
      name: STORAGE_KEYS.DEBTS,
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 2) {
          state.transactions = state.transactions ?? [];
          state.lastProcessedDate = state.lastProcessedDate ?? null;
        }
        return state as unknown as DebtState;
      },
    }
  )
);
