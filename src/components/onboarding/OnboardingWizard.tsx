import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { WelcomeStep } from './WelcomeStep';
import { BankSetupStep } from './BankSetupStep';
import { IncomeStep } from './IncomeStep';
import { BillsCalendarStep } from './BillsCalendarStep';
import { SpendingMoneySummary } from './SpendingMoneySummary';
import { PayScheduleStep } from './PayScheduleStep';
import { CategoryStep } from './CategoryStep';
import { LockAmountStep } from './LockAmountStep';
import { useUserStore } from '../../store/useUserStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { usePlaidStore } from '../../store/usePlaidStore';
import { getCurrentPeriodDates } from '../../lib/dateUtils';
import { calculateSpendingMoney, calculateLockedAmountForPeriod, calculateLockedAmountFromBalance, calculateBillsInPeriod } from '../../lib/calculations';
import { DEFAULT_LOCK_PERCENTAGE, DEFAULT_TASK_CATEGORIES } from '../../lib/constants';
import { generateId } from '../../lib/storage';
import type { RecurringBill, PaySchedule } from '../../types';

// Steps: Welcome → BankSetup → Income → PaySchedule → Bills → Summary → Categories → Lock
// When bank data is available, Income/PaySchedule/Bills/Summary are pre-filled and skipped
const STEPS = [
  'welcome',
  'bank-setup',
  'income',
  'pay-schedule',
  'bills',
  'summary',
  'categories',
  'lock',
] as const;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const createProfile = useUserStore((s) => s.createProfile);
  const createPeriod = usePayPeriodStore((s) => s.createPeriod);

  const [stepIndex, setStepIndex] = useState(0);
  const [income, setIncome] = useState(0);
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [paySchedule, setPaySchedule] = useState<PaySchedule>('monthly');
  const [nextPayDate, setNextPayDate] = useState('');
  const [lockPercentage, setLockPercentage] = useState(DEFAULT_LOCK_PERCENTAGE);
  const [taskCategories, setTaskCategories] = useState<string[]>(DEFAULT_TASK_CATEGORIES);
  const [bankDataApplied, setBankDataApplied] = useState(false);

  const currentStep = STEPS[stepIndex];

  const next = () => setStepIndex((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStepIndex((s) => Math.max(0, s - 1));

  // When bank data is detected, skip manual entry steps and jump to categories
  const handleBankNext = () => {
    if (bankDataApplied) {
      setStepIndex(STEPS.indexOf('categories'));
    } else {
      next();
    }
  };

  const handleBankDataReady = useCallback((data: {
    income: number;
    bills: RecurringBill[];
    paySchedule: PaySchedule;
    nextPayDate: string;
  }) => {
    setIncome(data.income);
    setBills(data.bills);
    setPaySchedule(data.paySchedule);
    setNextPayDate(data.nextPayDate);
    setBankDataApplied(true);
  }, []);

  const handleComplete = () => {
    const profile = createProfile({
      monthlyIncome: income,
      bills,
      paySchedule,
      nextPayDate,
      lockPercentage,
      taskCategories,
    });

    if (profile) {
      const referenceDate = nextPayDate ? new Date(nextPayDate + 'T00:00:00') : new Date();
      const { startDate, endDate } = getCurrentPeriodDates(paySchedule, referenceDate);

      // Use balance-based lock if Plaid is connected
      const plaidState = usePlaidStore.getState();
      let lockedAmount: number;

      if (plaidState.isConnected && plaidState.accounts.length > 0) {
        const checkingBalance = plaidState.accounts
          .filter((a) => a.type === 'checking')
          .reduce((sum, a) => sum + (a.availableBalance ?? a.currentBalance), 0);
        const upcomingBills = calculateBillsInPeriod(bills, new Date(startDate), new Date(endDate));
        lockedAmount = calculateLockedAmountFromBalance(checkingBalance, upcomingBills, lockPercentage);
      } else {
        lockedAmount = calculateLockedAmountForPeriod(
          income, bills, lockPercentage, paySchedule,
          new Date(startDate), new Date(endDate)
        );
      }

      createPeriod(startDate, endDate, lockedAmount);
      navigate('/', { replace: true });
    }
  };

  const spendingMoney = calculateSpendingMoney(income, bills);

  // Progress bar adapts based on whether bank data was used
  const visibleSteps = bankDataApplied
    ? ['welcome', 'bank-setup', 'categories', 'lock']
    : STEPS.slice();
  const progressIndex = visibleSteps.indexOf(currentStep);
  const progressPercent = progressIndex > 0 ? (progressIndex / (visibleSteps.length - 1)) * 100 : 0;

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Progress bar */}
      {stepIndex > 0 && (
        <div className="px-4 pt-4">
          <div className="h-1.5 bg-surface-light rounded-full overflow-hidden max-w-lg mx-auto">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        {currentStep === 'welcome' && <WelcomeStep onNext={next} />}
        {currentStep === 'bank-setup' && (
          <BankSetupStep
            onNext={handleBankNext}
            onBack={back}
            onBankDataReady={handleBankDataReady}
            generateId={generateId}
          />
        )}
        {currentStep === 'income' && (
          <IncomeStep income={income} setIncome={setIncome} onNext={next} onBack={back} />
        )}
        {currentStep === 'pay-schedule' && (
          <PayScheduleStep
            paySchedule={paySchedule}
            setPaySchedule={setPaySchedule}
            nextPayDate={nextPayDate}
            setNextPayDate={setNextPayDate}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 'bills' && (
          <BillsCalendarStep bills={bills} setBills={setBills} onNext={next} onBack={back} />
        )}
        {currentStep === 'summary' && (
          <SpendingMoneySummary
            income={income}
            bills={bills}
            spendingMoney={spendingMoney}
            onNext={next}
            onBack={back}
          />
        )}
        {currentStep === 'categories' && (
          <CategoryStep
            categories={taskCategories}
            setCategories={setTaskCategories}
            onNext={next}
            onBack={() => {
              if (bankDataApplied) {
                setStepIndex(STEPS.indexOf('bank-setup'));
              } else {
                back();
              }
            }}
          />
        )}
        {currentStep === 'lock' && (
          <LockAmountStep
            lockPercentage={lockPercentage}
            setLockPercentage={setLockPercentage}
            spendingMoney={spendingMoney}
            paySchedule={paySchedule}
            onComplete={handleComplete}
            onBack={back}
          />
        )}
      </div>
    </div>
  );
}
