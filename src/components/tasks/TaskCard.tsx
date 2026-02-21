import { CheckCircle, Check, Clock, Repeat, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { getDifficultyColor, getDifficultyLabel } from '../../lib/constants';
import { formatDate } from '../../lib/dateUtils';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  computedValue: number;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, computedValue, onComplete, onEdit, onDelete }: TaskCardProps) {
  const isActive = task.status === 'active';
  const isCompleted = task.status === 'completed';
  const isExpired = task.status === 'expired';
  const isPastDue = isActive && !!task.dueDate && new Date(task.dueDate + 'T23:59:59') < new Date();

  return (
    <Card className={`flex items-start gap-3 ${isCompleted ? 'opacity-70' : ''} ${isExpired ? 'opacity-50' : ''}`}>
      {isActive && (
        <button
          onClick={onComplete}
          className="shrink-0 mt-0.5 text-text-muted hover:text-primary transition-colors cursor-pointer"
          aria-label={`Complete ${task.name}`}
        >
          <CheckCircle size={24} />
        </button>
      )}
      {isCompleted && (
        <div className="shrink-0 mt-0.5 text-primary">
          <Check size={24} />
        </div>
      )}
      {isExpired && (
        <div className="shrink-0 mt-0.5 text-text-muted">
          <Clock size={24} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`font-medium ${isCompleted ? 'line-through' : ''}`}>{task.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge className={getDifficultyColor(task.difficulty)}>
            {getDifficultyLabel(task.difficulty)}
          </Badge>
          {task.recurringTemplateId && (
            <Badge className="bg-purple-500/20 text-purple-400">
              <Repeat size={10} className="inline mr-1" />
              Recurring
            </Badge>
          )}
          {task.dueDate && !isPastDue && (
            <span className="text-xs text-text-muted">Due {formatDate(task.dueDate)}</span>
          )}
        </div>
        {isPastDue && (
          <p className="flex items-center gap-1 text-xs font-medium text-red-400 mt-1">
            <AlertTriangle size={12} />
            Deadline passed: {formatDate(task.dueDate!)}
          </p>
        )}
        {task.notes && (
          <p className="text-sm text-text-muted mt-1 line-clamp-2">{task.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <CurrencyDisplay
          amount={computedValue}
          size="sm"
          className={isCompleted ? 'text-primary' : isExpired ? 'text-savings' : 'text-locked'}
        />
        {isActive && (
          <>
            <button
              onClick={onEdit}
              className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              aria-label={`Edit ${task.name}`}
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={onDelete}
              className="text-text-muted hover:text-red-400 transition-colors cursor-pointer"
              aria-label={`Delete ${task.name}`}
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
