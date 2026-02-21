import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { PAY_SCHEDULE_OPTIONS } from '../../lib/constants';
import type { PaySchedule } from '../../types';

interface PayScheduleStepProps {
  paySchedule: PaySchedule;
  setPaySchedule: (val: PaySchedule) => void;
  nextPayDate: string;
  setNextPayDate: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const scheduleDescriptions: Record<PaySchedule, string> = {
  'weekly': 'Every week (52 pay periods/year)',
  'bi-weekly': 'Every two weeks (26 pay periods/year)',
  'semi-monthly': '1st & 15th of each month (24 pay periods/year)',
  'monthly': 'Once a month (12 pay periods/year)',
};

export function PayScheduleStep({ paySchedule, setPaySchedule, nextPayDate, setNextPayDate, onNext, onBack }: PayScheduleStepProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">How often do you get paid?</h2>
          <p className="text-text-secondary">
            This determines the length of each Unlock period.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {(Object.keys(PAY_SCHEDULE_OPTIONS) as PaySchedule[]).map((schedule) => (
            <button
              key={schedule}
              onClick={() => setPaySchedule(schedule)}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer
                ${paySchedule === schedule
                  ? 'border-primary bg-primary/10'
                  : 'border-surface-light bg-surface hover:border-surface-light/80'
                }
              `}
            >
              <p className="font-medium">{PAY_SCHEDULE_OPTIONS[schedule].label}</p>
              <p className="text-sm text-text-muted mt-0.5">{scheduleDescriptions[schedule]}</p>
            </button>
          ))}
        </div>

        <Input
          label="When is your next pay day?"
          type="date"
          value={nextPayDate}
          onChange={(e) => setNextPayDate(e.target.value)}
        />
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <Button onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
          Continue
        </Button>
      </div>
    </div>
  );
}
