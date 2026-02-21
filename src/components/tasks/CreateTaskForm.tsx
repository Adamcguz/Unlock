import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TaskDifficultyPicker } from './TaskDifficultyPicker';
import { useTaskStore } from '../../store/useTaskStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { useUserStore } from '../../store/useUserStore';
import { RECURRENCE_OPTIONS } from '../../lib/constants';
import type { RecurrenceFrequency } from '../../types';
import { Plus } from 'lucide-react';

interface CreateTaskFormProps {
  periodId: string;
  onCreated: () => void;
}

export function CreateTaskForm({ periodId, onCreated }: CreateTaskFormProps) {
  const createTask = useTaskStore((s) => s.createTask);
  const addTaskToPeriod = usePayPeriodStore((s) => s.addTaskToPeriod);
  const createTemplate = useRecurringTaskStore((s) => s.createTemplate);
  const markGenerated = useRecurringTaskStore((s) => s.markGenerated);
  const taskCategories = useUserStore((s) => s.profile?.taskCategories ?? []);

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('every-period');
  const [timesPerPeriod, setTimesPerPeriod] = useState('1');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    const count = isRecurring ? Math.max(1, Math.min(20, parseInt(timesPerPeriod) || 1)) : 1;
    let recurringTemplateId: string | undefined;

    if (isRecurring) {
      const template = createTemplate({
        name: name.trim(),
        difficulty,
        notes: notes.trim(),
        frequency,
        timesPerPeriod: Math.max(1, Math.min(20, parseInt(timesPerPeriod) || 1)),
        category: category || undefined,
      });
      recurringTemplateId = template.id;
      markGenerated(template.id, periodId);
    }

    for (let i = 0; i < count; i++) {
      const task = createTask({
        payPeriodId: periodId,
        name: name.trim(),
        difficulty,
        dueDate: dueDate || null,
        notes: notes.trim(),
        recurringTemplateId,
        category: category || undefined,
      });
      addTaskToPeriod(periodId, task.id);
    }

    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Task Name"
        placeholder="e.g., Go for a 30-min run"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <TaskDifficultyPicker value={difficulty} onChange={setDifficulty} />

      {taskCategories.length > 0 && (
        <Select
          label="Category (optional)"
          options={[
            { value: '', label: 'No Category' },
            ...taskCategories.map((c) => ({ value: c, label: c })),
          ]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      )}

      <Input
        label="Due Date (optional)"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary font-medium">Notes (optional)</label>
        <textarea
          className="w-full bg-surface-light rounded-xl px-3 py-2.5 text-text-primary border border-transparent focus:border-primary focus:outline-none placeholder:text-text-muted transition-colors resize-none"
          rows={2}
          placeholder="Any additional details..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 rounded accent-primary cursor-pointer"
          />
          <span className="text-sm text-text-secondary font-medium">Repeat this task</span>
        </label>

        {isRecurring && (
          <div className="flex flex-col gap-3">
            <Select
              label="Frequency"
              options={RECURRENCE_OPTIONS}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
            />
            <Input
              label="How many times?"
              type="number"
              min={1}
              max={20}
              step={1}
              value={timesPerPeriod}
              onChange={(e) => setTimesPerPeriod(e.target.value)}
            />
            {parseInt(timesPerPeriod) > 1 && (
              <p className="text-xs text-text-muted">
                Creates {parseInt(timesPerPeriod)} separate tasks
              </p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" icon={<Plus size={16} />}>
        Create Task
      </Button>
    </form>
  );
}
