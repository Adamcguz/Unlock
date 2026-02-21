import { Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { getMaxTaskPercent } from '../../lib/calculations';
import { formatCurrency } from '../../lib/dateUtils';
import type { PayPeriod } from '../../types';

interface UnlockGuideProps {
  period: PayPeriod;
}

const EXAMPLES: Array<{ difficulty: number; label: string; color: string }> = [
  { difficulty: 1, label: 'Easy', color: 'text-green-400' },
  { difficulty: 5, label: 'Medium', color: 'text-yellow-400' },
  { difficulty: 10, label: 'Extreme', color: 'text-red-400' },
];

export function UnlockGuide({ period }: UnlockGuideProps) {
  const remaining = period.lockedAmount - period.unlockedAmount;
  if (remaining <= 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Info size={16} className="text-text-muted shrink-0" />
        <p className="text-sm text-text-secondary">
          To unlock the remaining <span className="font-semibold text-locked">{formatCurrency(remaining)}</span>, you'd need roughly:
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {EXAMPLES.map(({ difficulty, label, color }) => {
          const capPerTask = getMaxTaskPercent(difficulty) * period.lockedAmount;
          const tasksNeeded = Math.ceil(remaining / capPerTask);
          return (
            <div key={difficulty} className="bg-surface-light rounded-xl p-2.5 text-center">
              <p className="text-lg font-bold text-text-primary">{tasksNeeded}</p>
              <p className={`text-xs font-medium ${color}`}>{label}</p>
              <p className="text-[10px] text-text-muted mt-0.5">{formatCurrency(capPerTask)}/ea</p>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-text-muted text-center leading-relaxed">
        Harder tasks are worth more. The more tasks you add, the more each one's value is split up. As you finish tasks, what's left gets shared among the rest.
      </p>
    </Card>
  );
}
