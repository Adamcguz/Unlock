import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface IncomeStepProps {
  income: number;
  setIncome: (val: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function IncomeStep({ income, setIncome, onNext, onBack }: IncomeStepProps) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">What's your monthly take-home pay?</h2>
          <p className="text-text-secondary">
            Enter your after-tax income — the amount deposited into your account each month.
          </p>
        </div>
        <Input
          label="Monthly Income"
          prefix="$"
          type="number"
          min={0}
          step={100}
          placeholder="4,500"
          value={income || ''}
          onChange={(e) => setIncome(Number(e.target.value))}
          autoFocus
        />
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
          Back
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={!income || income <= 0}
          icon={<ArrowRight size={16} />}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
