import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGoalStore } from '../../store/useGoalStore';
import { Check } from 'lucide-react';
import type { Goal } from '../../types';

interface LogCheckInFormProps {
  goal: Goal;
  onDone: () => void;
}

export function LogCheckInForm({ goal, onDone }: LogCheckInFormProps) {
  const addCheckIn = useGoalStore((s) => s.addCheckIn);
  const [value, setValue] = useState(goal.currentValue?.toString() ?? '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numVal = parseFloat(value);
    if (isNaN(numVal)) {
      setError('Enter a valid number');
      return;
    }

    addCheckIn(goal.id, numVal, note.trim() || undefined);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-sm text-text-secondary">
        <span className="font-medium text-text-primary">{goal.name}</span>
        {goal.currentValue !== null && (
          <span> — currently at {goal.currentValue} {goal.unit}</span>
        )}
      </div>

      <Input
        label={`New Value (${goal.unit})`}
        type="number"
        step="any"
        placeholder={`e.g., ${goal.targetValue}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary font-medium">Note (optional)</label>
        <textarea
          className="w-full bg-surface-light rounded-xl px-3 py-2.5 text-text-primary border border-transparent focus:border-primary focus:outline-none placeholder:text-text-muted transition-colors resize-none"
          rows={2}
          placeholder="How's it going?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" icon={<Check size={16} />}>
        Log Progress
      </Button>
    </form>
  );
}
