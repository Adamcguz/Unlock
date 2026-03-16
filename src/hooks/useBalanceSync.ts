import { useEffect } from 'react';
import { useDebtStore } from '../store/useDebtStore';
import { useUserStore } from '../store/useUserStore';
import { usePayPeriodStore } from '../store/usePayPeriodStore';
import { addDays, startOfDay, format, isBefore, getDate, endOfMonth } from 'date-fns';
import { PAY_SCHEDULE_OPTIONS } from '../lib/constants';
import { getNextPayDateAfter } from '../lib/dateUtils';
import { calculateBillsInPeriod, calculateLockedAmountFromBalance } from '../lib/calculations';

/**
 * Syncs the account balance by auto-applying recurring bills and income deposits
 * for each day since the last processed date up to today.
 * Runs on mount and every 60 seconds.
 */
export function useBalanceSync() {
  useEffect(() => {
    function sync() {
      const { lastProcessedDate, accountBalance, deductFromBalance, creditToBalance, setLastProcessedDate } =
        useDebtStore.getState();
      const profile = useUserStore.getState().profile;

      // Don't process if no account balance has been set or no profile exists
      if (!profile || accountBalance === 0 && lastProcessedDate === null) return;

      const today = startOfDay(new Date());
      const todayStr = format(today, 'yyyy-MM-dd');

      // If no lastProcessedDate, initialize to today (don't retroactively apply)
      if (!lastProcessedDate) {
        setLastProcessedDate(todayStr);
        return;
      }

      // Don't reprocess if already up to date
      if (lastProcessedDate >= todayStr) return;

      // Walk through each day from lastProcessedDate+1 to today
      let cursor = addDays(new Date(lastProcessedDate), 1);
      let nextPayDate = profile.nextPayDate;

      const periodsPerMonth = PAY_SCHEDULE_OPTIONS[profile.paySchedule].periodsPerMonth;
      const incomePerPeriod = Math.round((profile.monthlyIncome / periodsPerMonth) * 100) / 100;

      while (!isBefore(today, startOfDay(cursor))) {
        const cursorDay = getDate(cursor);
        const lastDayOfMonth = getDate(endOfMonth(cursor));

        // Check each bill
        for (const bill of profile.bills) {
          const effectiveDay = Math.min(bill.dayOfMonth, lastDayOfMonth);
          if (cursorDay === effectiveDay) {
            deductFromBalance(bill.amount, bill.name, 'bill');
          }
        }

        // Check if it's a pay day
        const payDate = startOfDay(new Date(nextPayDate));
        if (format(cursor, 'yyyy-MM-dd') === format(payDate, 'yyyy-MM-dd')) {
          creditToBalance(incomePerPeriod, 'Paycheck', 'deposit');
          nextPayDate = getNextPayDateAfter(nextPayDate, profile.paySchedule);
          // Update the stored nextPayDate so future cycles use the right date
          useUserStore.getState().updateProfile({ nextPayDate });
        }

        cursor = addDays(cursor, 1);
      }

      setLastProcessedDate(todayStr);
    }

    function recalcLock() {
      const balance = useDebtStore.getState().accountBalance;
      const prof = useUserStore.getState().profile;
      const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
      if (!prof || !currentPeriod || balance <= 0) return;

      // Use bills due between now and the end of the current period
      const periodEnd = new Date(currentPeriod.endDate);
      const upcomingBills = calculateBillsInPeriod(prof.bills, new Date(), periodEnd);
      const newLocked = calculateLockedAmountFromBalance(balance, upcomingBills, prof.lockPercentage);
      if (Math.abs(newLocked - currentPeriod.lockedAmount) > 0.01) {
        usePayPeriodStore.getState().updatePeriodLockedAmount(currentPeriod.id, newLocked);
      }
    }

    sync();
    recalcLock();
    const interval = setInterval(() => { sync(); recalcLock(); }, 60000);
    return () => clearInterval(interval);
  }, []);
}
