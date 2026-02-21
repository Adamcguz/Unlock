import { Lock, Unlock } from 'lucide-react';
import { Card } from '../ui/Card';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { ProgressBar } from '../ui/ProgressBar';
import type { PayPeriod } from '../../types';

interface FinancialSummaryCardProps {
  period: PayPeriod;
}

export function FinancialSummaryCard({ period }: FinancialSummaryCardProps) {
  const remaining = Math.max(0, period.lockedAmount - period.unlockedAmount);
  const unlockProgress = period.lockedAmount > 0 ? period.unlockedAmount / period.lockedAmount : 0;

  return (
    <Card>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Lock size={14} className="text-locked" />
            <span className="text-xs text-text-muted font-medium">Locked</span>
          </div>
          <CurrencyDisplay amount={remaining} size="md" className="text-locked" />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Unlock size={14} className="text-primary" />
            <span className="text-xs text-text-muted font-medium">Unlocked</span>
          </div>
          <CurrencyDisplay amount={period.unlockedAmount} size="md" className="text-primary" />
        </div>
      </div>
      <ProgressBar value={unlockProgress} color="bg-primary" className="mt-3" />
      <p className="text-xs text-text-muted text-center mt-2">
        {Math.round(unlockProgress * 100)}% of locked money earned back
      </p>
    </Card>
  );
}
