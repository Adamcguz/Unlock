import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { ArrowLeft, Lock } from 'lucide-react';
import { calculateLockedAmountPerPeriod } from '../../lib/calculations';
import { PAY_SCHEDULE_OPTIONS } from '../../lib/constants';
import type { PaySchedule } from '../../types';

interface LockAmountStepProps {
  lockPercentage: number;
  setLockPercentage: (val: number) => void;
  spendingMoney: number;
  paySchedule: PaySchedule;
  onComplete: () => void;
  onBack: () => void;
}

export function LockAmountStep({
  lockPercentage,
  setLockPercentage,
  spendingMoney,
  paySchedule,
  onComplete,
  onBack,
}: LockAmountStepProps) {
  const lockedPerPeriod = calculateLockedAmountPerPeriod(spendingMoney, lockPercentage, paySchedule);
  const scheduleLabel = PAY_SCHEDULE_OPTIONS[paySchedule].label.toLowerCase();

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">How much will you lock?</h2>
          <p className="text-text-secondary">
            Choose what percentage of your spending money to lock each {scheduleLabel} period.
            You'll earn it back by completing tasks.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-6 text-center">
          <p className="text-text-muted text-sm mb-1">Locked per {scheduleLabel} period</p>
          <CurrencyDisplay amount={lockedPerPeriod} size="xl" className="text-locked" />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary font-medium">Lock Percentage</span>
            <span className="text-lg font-bold text-locked">{lockPercentage}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={lockPercentage}
            onChange={(e) => setLockPercentage(Number(e.target.value))}
            className="w-full accent-locked"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="bg-surface-light rounded-xl p-3 text-sm text-text-secondary text-center">
          Complete all your tasks to unlock the full{' '}
          <span className="text-primary font-medium">
            <CurrencyDisplay amount={lockedPerPeriod} size="sm" className="text-primary" />
          </span>{' '}
          each period.
        </div>
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <Button onClick={onComplete} className="flex-1" icon={<Lock size={16} />}>
          Start Unlocking
        </Button>
      </div>
    </div>
  );
}
