import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { usePlaidStore } from '../store/usePlaidStore';
import { useDebtStore } from '../store/useDebtStore';
import { syncBalances, syncTransactions } from '../lib/api';
import { detectRecurringBills, detectIncomeDeposits } from '../lib/transactionDetection';
import type { PlaidAccount } from '../types/plaid';

const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Sync credit card accounts from Plaid into the Debts list.
 * Creates new debts for untracked credit cards, updates balances for existing ones.
 */
function syncCreditCardDebts(accounts: PlaidAccount[]) {
  const creditAccounts = accounts.filter((a) => a.type === 'credit');
  if (creditAccounts.length === 0) return;

  const debtStore = useDebtStore.getState();

  for (const acct of creditAccounts) {
    // Check if we already have a debt linked to this Plaid account
    const existingDebt = debtStore.debts.find((d) => d.plaidAccountId === acct.accountId);

    if (existingDebt) {
      // Update balance (Plaid credit card balances are positive = amount owed)
      const newBalance = Math.abs(acct.currentBalance);
      if (Math.abs(existingDebt.balance - newBalance) > 0.01) {
        debtStore.updateDebt(existingDebt.id, { balance: newBalance });
      }
    } else {
      // Create a new debt for this credit card
      debtStore.addDebt({
        name: acct.name,
        type: 'credit-card',
        balance: Math.abs(acct.currentBalance),
        minimumPayment: estimateMinimumPayment(Math.abs(acct.currentBalance)),
        apr: 24.99, // Default APR — user can edit this
        plaidAccountId: acct.accountId,
      });
    }
  }
}

/**
 * Estimate minimum payment based on balance.
 * Most credit cards use ~1-2% of balance or $25, whichever is greater.
 */
function estimateMinimumPayment(balance: number): number {
  if (balance <= 0) return 0;
  return Math.max(25, Math.round(balance * 0.02 * 100) / 100);
}

export function usePlaidSync() {
  const user = useAuthStore((s) => s.user);
  const { isConnected, setSyncing, setAccounts, setTransactions, setLastSyncedAt, setError } = usePlaidStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user || !isConnected) return;

    async function doSync() {
      if (usePlaidStore.getState().isSyncing) return;

      setSyncing(true);
      setError(null);

      try {
        // Sync balances
        const balanceData = await syncBalances();
        setAccounts(balanceData.accounts);

        // Update the app's account balance from Plaid checking accounts
        const checkingAccounts = balanceData.accounts.filter(
          (a) => a.type === 'checking'
        );
        if (checkingAccounts.length > 0) {
          const totalAvailable = checkingAccounts.reduce(
            (sum, a) => sum + (a.availableBalance ?? a.currentBalance),
            0
          );
          useDebtStore.getState().setAccountBalance(totalAvailable);
        }

        // Sync credit card balances into the Debts list
        syncCreditCardDebts(balanceData.accounts);

        // Sync transactions
        const txData = await syncTransactions();
        setTransactions(txData.transactions);

        // Run pattern detection on synced transactions
        if (txData.transactions.length > 0) {
          const bills = detectRecurringBills(txData.transactions);
          const income = detectIncomeDeposits(txData.transactions);
          usePlaidStore.getState().setDetectedBills(bills);
          usePlaidStore.getState().setDetectedIncome(income);
        }

        setLastSyncedAt(new Date().toISOString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      } finally {
        setSyncing(false);
      }
    }

    // Initial sync
    doSync();

    // Periodic sync
    intervalRef.current = setInterval(doSync, SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, isConnected, setSyncing, setAccounts, setTransactions, setLastSyncedAt, setError]);
}
