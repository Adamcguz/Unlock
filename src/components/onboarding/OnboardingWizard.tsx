import { useState } from 'react';
import { useNavigate } from 'react-router';
import { WelcomeStep } from './WelcomeStep';
import { IncomeStep } from './IncomeStep';
import { BillsCalendarStep } from './BillsCalendarStep';
import { SpendingMoneySummary } from './SpendingMoneySummary';
import { PayScheduleStep } from './PayScheduleStep';
import { CategoryStep } from './CategoryStep';
import { LockAmountStep } from './LockAmountStep';
import { useUserStore } from '../../store/useUserStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { getCurrentPeriodDates } from '../../lib/dateUtils';
import { calculateSpendingMoney, calculateLockedAmountForPeriod } from '../../lib/calculations';
import { DEFAULT_LOCK_PERCENTAGE, DEFAULT_TASK_CATEGORIES } from '../../lib/constants';
import type { RecurringBill, PaySchedule } from '../../types';

const TOTAL_STEPS = 7;

export function OnboardingWizard() {
  const navigate = useNavigate();
  const createProfile = useUserStore((s) => s.createProfile);
  const createPeriod = usePayPeriodStore((s) => s.createPeriod);

  const [step, setStep] = useState(0);
  const [income, setIncome] = useState(0);
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [paySchedule, setPaySchedule] = useState<PaySchedule>('monthly');
  const [nextPayDate, setNextPayDate] = useState('');
  const [lockPercentage, setLockPercentage] = useState(DEFAULT_LOCK_PERCENTAGE);
  const [taskCategories, setTaskCategories] = useState<string[]>(DEFAULT_TASK_CATEGORIES);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

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
      const lockedAmount = calculateLockedAmountForPeriod(
        income, bills, lockPercentage, paySchedule,
        new Date(startDate), new Date(endDate)
      );
      createPeriod(startDate, endDate, lockedAmount);
      navigate('/', { replace: true });
    }
  };

  const spendingMoney = calculateSpendingMoney(income, bills);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Progress bar */}
      {step > 0 && (
        <div className="px-4 pt-4">
          <div className="h-1.5 bg-surface-light rounded-full overflow-hidden max-w-lg mx-auto">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((step) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-6">
        {step === 0 && <WelcomeStep onNext={next} />}
        {step === 1 && (
          <IncomeStep income={income} setIncome={setIncome} onNext={next} onBack={back} />
        )}
        {step === 2 && (
          <PayScheduleStep
            paySchedule={paySchedule}
            setPaySchedule={setPaySchedule}
            nextPayDate={nextPayDate}
            setNextPayDate={setNextPayDate}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <BillsCalendarStep bills={bills} setBills={setBills} onNext={next} onBack={back} />
        )}
        {step === 4 && (
          <SpendingMoneySummary
            income={income}
            bills={bills}
            spendingMoney={spendingMoney}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && (
          <CategoryStep
            categories={taskCategories}
            setCategories={setTaskCategories}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 6 && (
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
