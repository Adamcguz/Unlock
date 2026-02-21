import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../lib/constants';
import { calculateTotalExpenses } from '../../lib/calculations';
import { formatCurrency } from '../../lib/dateUtils';
import type { ExpenseBreakdown } from '../../types';

interface ExpensesStepProps {
  expenses: ExpenseBreakdown;
  setExpenses: (val: ExpenseBreakdown) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ExpensesStep({ expenses, setExpenses, onNext, onBack }: ExpensesStepProps) {
  const total = calculateTotalExpenses(expenses);

  const updateCategory = (key: keyof ExpenseBreakdown, value: number) => {
    setExpenses({ ...expenses, [key]: value });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Estimate your monthly expenses</h2>
          <p className="text-text-secondary">
            These don't need to be exact — a rough estimate works.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {EXPENSE_CATEGORIES.map(({ key, label }) => (
            <Input
              key={key}
              label={label}
              prefix="$"
              type="number"
              min={0}
              step={50}
              placeholder="0"
              value={expenses[key] || ''}
              onChange={(e) => updateCategory(key, Number(e.target.value))}
            />
          ))}
        </div>

        <div className="bg-surface-light rounded-xl p-3 flex items-center justify-between">
          <span className="text-text-secondary font-medium">Total Expenses</span>
          <span className="text-lg font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="flex gap-3 pt-6 sticky bottom-0 bg-background py-4">
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
