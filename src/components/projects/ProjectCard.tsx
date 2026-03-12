import { ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const total = project.tasks.length;
  const completed = project.tasks.filter((t) => t.status === 'completed').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const nextPending = project.tasks
    .filter((t) => t.status === 'pending')
    .sort((a, b) => a.assignedDate.localeCompare(b.assignedDate))[0];

  const isCompleted = project.status === 'completed';

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left bg-surface-light rounded-xl p-4 transition-colors hover:bg-surface-light/80 cursor-pointer ${
        isCompleted ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
            {isCompleted && (
              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            )}
          </div>
          {project.description && (
            <p className="text-sm text-text-secondary mt-0.5 line-clamp-1">
              {project.description}
            </p>
          )}
        </div>
        <ChevronRight size={18} className="text-text-muted shrink-0 mt-1" />
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{completed}/{total} tasks</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {nextPending && !isCompleted && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar size={12} />
            <span>Next: {format(parseISO(nextPending.assignedDate), 'MMM d')}</span>
          </div>
        )}
      </div>
    </button>
  );
}
