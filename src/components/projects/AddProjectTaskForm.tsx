import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TaskDifficultyPicker } from '../tasks/TaskDifficultyPicker';
import { useProjectStore } from '../../store/useProjectStore';
import { Plus } from 'lucide-react';
import type { ProjectTask } from '../../types';

interface AddProjectTaskFormProps {
  projectId: string;
  editingTask?: ProjectTask;
  onDone: () => void;
}

export function AddProjectTaskForm({ projectId, editingTask, onDone }: AddProjectTaskFormProps) {
  const addProjectTask = useProjectStore((s) => s.addProjectTask);
  const updateProjectTask = useProjectStore((s) => s.updateProjectTask);
  const [name, setName] = useState(editingTask?.name ?? '');
  const [difficulty, setDifficulty] = useState(editingTask?.difficulty ?? 5);
  const [assignedDate, setAssignedDate] = useState(editingTask?.assignedDate ?? '');
  const [notes, setNotes] = useState(editingTask?.notes ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Task name is required');
      return;
    }
    if (!assignedDate) {
      setError('Assigned date is required');
      return;
    }

    if (editingTask) {
      updateProjectTask(projectId, editingTask.id, {
        name: name.trim(),
        difficulty,
        assignedDate,
        notes: notes.trim(),
      });
    } else {
      addProjectTask(projectId, {
        name: name.trim(),
        difficulty,
        assignedDate,
        notes: notes.trim(),
      });
    }

    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Task Name"
        placeholder="e.g., Buy paint supplies"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <TaskDifficultyPicker value={difficulty} onChange={setDifficulty} />

      <Input
        label="Assigned Date"
        type="date"
        value={assignedDate}
        onChange={(e) => setAssignedDate(e.target.value)}
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

      <Button type="submit" icon={<Plus size={16} />}>
        {editingTask ? 'Save Changes' : 'Add Task'}
      </Button>
    </form>
  );
}
