import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useTaskStore } from '../../store/useTaskStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { useRecurringTaskStore } from '../../store/useRecurringTaskStore';
import { getDifficultyColor, getDifficultyLabel } from '../../lib/constants';
import { calculateTaskValues, getExpectedCompletions } from '../../lib/calculations';

interface ActiveTasksListProps {
  periodId: string;
  onCompleteTask: (taskId: string) => void;
}

export function ActiveTasksList({ periodId, onCompleteTask }: ActiveTasksListProps) {
  const navigate = useNavigate();
  const allTasks = useTaskStore((s) => s.tasks);
  const periods = usePayPeriodStore((s) => s.periods);
  const period = periods.find((p) => p.id === periodId);

  const tasks = useMemo(
    () => allTasks.filter((t) => t.payPeriodId === periodId && t.status === 'active'),
    [allTasks, periodId]
  );

  const templates = useRecurringTaskStore((s) => s.templates);

  const valueMap = useMemo(() => {
    if (!period) return new Map<string, number>();
    const remainingBudget = period.lockedAmount - period.unlockedAmount;
    const periodDays = Math.max(1, Math.round(
      (new Date(period.endDate).getTime() - new Date(period.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const expected = new Map<string, number>();
    for (const t of templates) {
      expected.set(t.id, getExpectedCompletions(t.frequency, t.timesPerPeriod, periodDays));
    }
    return calculateTaskValues(tasks, remainingBudget, period.lockedAmount, expected);
  }, [tasks, period, templates]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No active tasks"
        description="Create tasks to start unlocking your money."
        action={
          <Button size="sm" onClick={() => navigate('/tasks')} icon={<Plus size={16} />}>
            Add Task
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Active Tasks</h3>
        <span className="text-xs text-text-muted">{tasks.length} remaining</span>
      </div>
      {tasks.slice(0, 5).map((task) => (
        <Card key={task.id} className="flex items-center gap-3 p-3">
          <button
            onClick={() => onCompleteTask(task.id)}
            className="shrink-0 text-text-muted hover:text-primary transition-colors cursor-pointer"
            aria-label={`Complete ${task.name}`}
          >
            <CheckCircle size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{task.name}</p>
            <Badge className={getDifficultyColor(task.difficulty)}>
              {getDifficultyLabel(task.difficulty)}
            </Badge>
          </div>
          <CurrencyDisplay amount={valueMap.get(task.id) ?? 0} size="sm" className="text-primary shrink-0" />
        </Card>
      ))}
      {tasks.length > 5 && (
        <button
          onClick={() => navigate('/tasks')}
          className="text-sm text-primary hover:underline text-center py-1 cursor-pointer"
        >
          View all {tasks.length} tasks
        </button>
      )}
    </div>
  );
}
