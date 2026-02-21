import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TaskDifficultyPicker } from './TaskDifficultyPicker';
import { useTaskStore } from '../../store/useTaskStore';
import { useUserStore } from '../../store/useUserStore';
import { Save } from 'lucide-react';
import type { Task } from '../../types';

interface EditTaskFormProps {
  task: Task;
  onSaved: () => void;
}

export function EditTaskForm({ task, onSaved }: EditTaskFormProps) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const taskCategories = useUserStore((s) => s.profile?.taskCategories ?? []);

  const [name, setName] = useState(task.name);
  const [difficulty, setDifficulty] = useState(task.difficulty);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [notes, setNotes] = useState(task.notes);
  const [category, setCategory] = useState(task.category ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    updateTask(task.id, {
      name: name.trim(),
      difficulty,
      dueDate: dueDate || null,
      notes: notes.trim(),
      category: category || undefined,
    });

    onSaved();
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

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" icon={<Save size={16} />}>
        Save Changes
      </Button>
    </form>
  );
}
