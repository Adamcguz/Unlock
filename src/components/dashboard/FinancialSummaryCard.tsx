import { useState } from 'react';
import { Lock, Unlock, ShoppingCart } from 'lucide-react';
import { Card } from '../ui/Card';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { ProgressBar } from '../ui/ProgressBar';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { useDebtStore } from '../../store/useDebtStore';
import type { PayPeriod } from '../../types';

interface FinancialSummaryCardProps {
  period: PayPeriod;
}

export function FinancialSummaryCard({ period }: FinancialSummaryCardProps) {
  const [showSpendModal, setShowSpendModal] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [error, setError] = useState('');

  const remaining = Math.max(0, period.lockedAmount - period.unlockedAmount);
  const unlockProgress = period.lockedAmount > 0 ? period.unlockedAmount / period.lockedAmount : 0;
  const available = Math.max(0, period.unlockedAmount - period.spentAmount);

  const handleSubmitSpend = () => {
    const amount = parseFloat(spendAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (amount > available) {
      setError('Amount exceeds available balance');
      return;
    }
    usePayPeriodStore.getState().recordSpending(period.id, amount);
    useDebtStore.getState().deductFromBalance(amount, 'Spending', 'spending');
    setSpendAmount('');
    setError('');
    setShowSpendModal(false);
  };

  const handleClose = () => {
    setShowSpendModal(false);
    setSpendAmount('');
    setError('');
  };

  return (
    <>
      <Card>
        <div className="grid grid-cols-3 gap-3">
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
            <CurrencyDisplay amount={available} size="md" className="text-primary" />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ShoppingCart size={14} className="text-danger" />
              <span className="text-xs text-text-muted font-medium">Spent</span>
            </div>
            <CurrencyDisplay amount={period.spentAmount} size="md" className="text-danger" />
          </div>
        </div>
        <ProgressBar value={unlockProgress} color="bg-primary" className="mt-3" />
        <p className="text-xs text-text-muted text-center mt-2">
          {Math.round(unlockProgress * 100)}% of locked money earned back
        </p>
        <div className="mt-3 flex justify-end border-t border-surface-light pt-3">
          <Button
            size="sm"
            variant="secondary"
            icon={<ShoppingCart size={14} />}
            onClick={() => setShowSpendModal(true)}
          >
            Log Spending
          </Button>
        </div>
      </Card>

      <Modal isOpen={showSpendModal} onClose={handleClose} title="Log Spending">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-muted">
            Available: <CurrencyDisplay amount={available} size="sm" className="text-primary inline" />
          </p>
          <Input
            label="Amount"
            prefix="$"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={spendAmount}
            onChange={(e) => {
              setSpendAmount(e.target.value);
              setError('');
            }}
            error={error}
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmitSpend} className="flex-1">
              Log Spend
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
