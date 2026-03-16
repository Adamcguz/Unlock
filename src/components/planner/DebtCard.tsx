import { CreditCard, GraduationCap, Wallet, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import type { Debt } from '../../types';

interface DebtCardProps {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
}

const typeConfig = {
  'credit-card': { icon: CreditCard, label: 'Credit Card', color: 'bg-orange-500/20 text-orange-400' },
  'student-loan': { icon: GraduationCap, label: 'Student Loan', color: 'bg-blue-500/20 text-blue-400' },
  'other': { icon: Wallet, label: 'Other', color: 'bg-gray-500/20 text-gray-400' },
};

export function DebtCard({ debt, onEdit, onDelete }: DebtCardProps) {
  const config = typeConfig[debt.type];
  const Icon = config.icon;
  const monthlyInterest = Math.round((debt.balance * (debt.apr / 100) / 12) * 100) / 100;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={18} className="text-text-secondary shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-text-primary truncate">{debt.name}</h3>
            <Badge className={config.color}>{config.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 text-text-muted hover:text-text-primary cursor-pointer">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 text-text-muted hover:text-danger cursor-pointer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <span className="text-xs text-text-muted">Balance</span>
          <CurrencyDisplay amount={debt.balance} size="sm" className="text-text-primary" />
        </div>
        <div>
          <span className="text-xs text-text-muted">Min Payment</span>
          <CurrencyDisplay amount={debt.minimumPayment} size="sm" className="text-text-primary" />
        </div>
        <div>
          <span className="text-xs text-text-muted">APR</span>
          <p className="text-sm font-semibold text-text-primary">{debt.apr}%</p>
        </div>
      </div>
      {monthlyInterest > 0 && (
        <p className="text-xs text-text-muted mt-2">
          ~<CurrencyDisplay amount={monthlyInterest} size="sm" className="text-danger inline" />/mo in interest
        </p>
      )}
    </Card>
  );
}
