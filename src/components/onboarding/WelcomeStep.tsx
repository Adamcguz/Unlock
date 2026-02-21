import { Unlock, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Unlock size={40} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Unlock</h1>
        <p className="text-text-secondary text-lg max-w-xs leading-relaxed">
          Earn your spending money by completing tasks you set for yourself.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="flex items-start gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-locked/20 text-locked flex items-center justify-center text-sm font-bold shrink-0">
            1
          </div>
          <div>
            <p className="font-medium">Lock your spending money</p>
            <p className="text-sm text-text-muted">Set aside a portion each pay period</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">
            2
          </div>
          <div>
            <p className="font-medium">Complete your tasks</p>
            <p className="text-sm text-text-muted">Finish tasks to unlock money</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-savings/20 text-savings flex items-center justify-center text-sm font-bold shrink-0">
            3
          </div>
          <div>
            <p className="font-medium">Build your savings</p>
            <p className="text-sm text-text-muted">Uncompleted tasks become savings</p>
          </div>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full max-w-xs" icon={<ArrowRight size={18} />}>
        Get Started
      </Button>
    </div>
  );
}
