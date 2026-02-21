import { Button } from '../ui/Button';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { calculateTotalExpenses } from '../../lib/calculations';
import { formatCurrency } from '../../lib/dateUtils';
import type { ExpenseBreakdown } from '../../types';

interface SpendingMoneySummaryProps {
  income: number;
  expenses: ExpenseBreakdown;
  spendingMoney: number;
  onNext: () => void;
  onBack: () => void;
}

export function SpendingMoneySummary({
  income,
  expenses,
  spendingMoney,
  onNext,
  onBack,
}: SpendingMoneySummaryProps) {
  const totalExpenses = calculateTotalExpenses(expenses);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Your Spending Money</h2>
          <p className="text-text-secondary">
            This is the money available after your expenses.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-6 text-center">
          <p className="text-text-muted text-sm mb-1">Monthly Spending Money</p>
          <CurrencyDisplay
            amount={spendingMoney}
            size="xl"
            className={spendingMoney > 0 ? 'text-primary' : 'text-danger'}
          />
        </div>

        <div className="bg-surface-light rounded-xl p-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Monthly Income</span>
            <span>{formatCurrency(income)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Total Expenses</span>
            <span className="text-danger">-{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="border-t border-surface pt-2 flex justify-between font-medium">
            <span>Spending Money</span>
            <span className="text-primary">{formatCurrency(spendingMoney)}</span>
          </div>
        </div>

        {spendingMoney <= 0 && (
          <p className="text-sm text-savings text-center">
            Your expenses exceed your income. You can go back and adjust, or continue with $0 spending money.
          </p>
        )}
      </div>
      <div className="flex gap-3 pt-6">
        <Button variant="ghost" onClick={onBack} icon={<ArrowLeft size={16} />}>
          Adjust
        </Button>
        <Button onClick={onNext} className="flex-1" icon={<ArrowRight size={16} />}>
          Looks Good
        </Button>
      </div>
    </div>
  );
}
