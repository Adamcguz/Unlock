import { Repeat, Pause, Play, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { RECURRENCE_OPTIONS, getDifficultyColor, getDifficultyLabel } from '../../lib/constants';

function getFrequencyLabel(frequency: string): string {
  return RECURRENCE_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency;
}

export function RecurringTaskManager() {
  const templates = useRecurringTaskStore((s) => s.templates);
  const pauseTemplate = useRecurringTaskStore((s) => s.pauseTemplate);
  const resumeTemplate = useRecurringTaskStore((s) => s.resumeTemplate);
  const deleteTemplate = useRecurringTaskStore((s) => s.deleteTemplate);

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={<Repeat size={40} />}
        title="No recurring tasks"
        description="When you create a task with 'Repeat this task' enabled, it will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((template) => (
        <Card key={template.id} className={`flex items-center gap-3 p-3 ${!template.isActive ? 'opacity-50' : ''}`}>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{template.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-purple-500/20 text-purple-400">
                {template.timesPerPeriod > 1 ? `${template.timesPerPeriod}x ` : ''}{getFrequencyLabel(template.frequency)}
              </Badge>
              <Badge className={template.isActive ? 'bg-green-500/20 text-green-400' : 'bg-surface-light text-text-muted'}>
                {template.isActive ? 'Active' : 'Paused'}
              </Badge>
              {template.category && (
                <Badge className="bg-white/10 text-text-secondary">
                  {template.category}
                </Badge>
              )}
            </div>
          </div>

          <Badge className={`${getDifficultyColor(template.difficulty)} shrink-0`}>
            {getDifficultyLabel(template.difficulty)}
          </Badge>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => template.isActive ? pauseTemplate(template.id) : resumeTemplate(template.id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-light transition-colors cursor-pointer"
              aria-label={template.isActive ? 'Pause' : 'Resume'}
            >
              {template.isActive ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              onClick={() => deleteTemplate(template.id)}
              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-surface-light transition-colors cursor-pointer"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
