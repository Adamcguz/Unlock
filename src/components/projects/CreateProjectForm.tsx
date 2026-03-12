import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useProjectStore } from '../../store/useProjectStore';
import { Plus } from 'lucide-react';

interface CreateProjectFormProps {
  onCreated: (projectId: string) => void;
}

export function CreateProjectForm({ onCreated }: CreateProjectFormProps) {
  const createProject = useProjectStore((s) => s.createProject);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    const project = createProject({
      name: name.trim(),
      description: description.trim(),
    });
    onCreated(project.id);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Project Name"
        placeholder="e.g., Renovate the kitchen"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-secondary font-medium">Description (optional)</label>
        <textarea
          className="w-full bg-surface-light rounded-xl px-3 py-2.5 text-text-primary border border-transparent focus:border-primary focus:outline-none placeholder:text-text-muted transition-colors resize-none"
          rows={3}
          placeholder="What's the goal of this project?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" icon={<Plus size={16} />}>
        Create Project
      </Button>
    </form>
  );
}
