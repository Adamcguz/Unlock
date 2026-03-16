import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Debt, DebtType } from '../../types';

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; type: DebtType; balance: number; minimumPayment: number; apr: number }) => void;
  debt?: Debt | null;
}

const typeOptions = [
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'student-loan', label: 'Student Loan' },
  { value: 'other', label: 'Other' },
];

export function DebtFormModal({ isOpen, onClose, onSubmit, debt }: DebtFormModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<DebtType>('credit-card');
  const [balance, setBalance] = useState('');
  const [minimumPayment, setMinimumPayment] = useState('');
  const [apr, setApr] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setType(debt.type);
      setBalance(debt.balance.toString());
      setMinimumPayment(debt.minimumPayment.toString());
      setApr(debt.apr.toString());
    } else {
      setName('');
      setType('credit-card');
      setBalance('');
      setMinimumPayment('');
      setApr('');
    }
    setError('');
  }, [debt, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    const bal = parseFloat(balance);
    if (isNaN(bal) || bal <= 0) {
      setError('Balance must be greater than 0');
      return;
    }
    const min = parseFloat(minimumPayment);
    if (isNaN(min) || min < 0) {
      setError('Minimum payment must be 0 or more');
      return;
    }
    const aprVal = parseFloat(apr);
    if (isNaN(aprVal) || aprVal < 0) {
      setError('APR must be 0 or more');
      return;
    }
    onSubmit({
      name: name.trim(),
      type,
      balance: bal,
      minimumPayment: min,
      apr: aprVal,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={debt ? 'Edit Debt' : 'Add Debt'}>
      <div className="flex flex-col gap-4">
        <Input
          label="Name"
          placeholder="e.g. Chase Visa"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          autoFocus
        />
        <Select
          label="Type"
          options={typeOptions}
          value={type}
          onChange={(e) => setType(e.target.value as DebtType)}
        />
        <Input
          label="Balance"
          prefix="$"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={balance}
          onChange={(e) => { setBalance(e.target.value); setError(''); }}
        />
        <Input
          label="Minimum Monthly Payment"
          prefix="$"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={minimumPayment}
          onChange={(e) => { setMinimumPayment(e.target.value); setError(''); }}
        />
        <Input
          label="APR (%)"
          type="number"
          min="0"
          step="0.1"
          placeholder="0.0"
          value={apr}
          onChange={(e) => { setApr(e.target.value); setError(''); }}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            {debt ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
