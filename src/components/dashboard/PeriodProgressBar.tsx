import { Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { getDaysRemaining, getPeriodProgress, formatShortDate } from '../../lib/dateUtils';
import type { PayPeriod } from '../../types';

interface PeriodProgressBarProps {
  period: PayPeriod;
}

export function PeriodProgressBar({ period }: PeriodProgressBarProps) {
  const daysLeft = getDaysRemaining(period.endDate);
  const progress = getPeriodProgress(period.startDate, period.endDate);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-text-muted" />
          <span className="text-sm font-medium">Current Period</span>
        </div>
        <span className="text-xs text-text-muted">
          {formatShortDate(period.startDate)} — {formatShortDate(period.endDate)}
        </span>
      </div>
      <ProgressBar value={progress} color="bg-locked" />
      <p className="text-xs text-text-muted text-center">
        {daysLeft === 0
          ? 'Last day of this period'
          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
      </p>
    </Card>
  );
}
