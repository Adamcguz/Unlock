import type { TaskStatus } from '../../types';

export type TaskFilter = TaskStatus | 'all' | 'recurring';

interface TaskFiltersProps {
  current: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

const filters: { value: TaskFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'all', label: 'All' },
];

export function TaskFilters({ current, onChange }: TaskFiltersProps) {
  return (
    <div className="flex gap-2">
      {filters.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`
            px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
            ${current === value
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:text-text-secondary'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
