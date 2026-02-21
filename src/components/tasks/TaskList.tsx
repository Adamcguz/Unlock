import { useMemo, useState, useCallback } from 'react';
import { ListTodo, ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../ui/EmptyState';
import { useTaskStore } from '../../store/useTaskStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { calculateTaskValues } from '../../lib/calculations';
import type { TaskStatus } from '../../types';

interface TaskListProps {
  periodId: string;
  filter: TaskStatus | 'all';
  onCompleteTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({ periodId, filter, onCompleteTask, onEditTask, onDeleteTask }: TaskListProps) {
  const allTasks = useTaskStore((s) => s.tasks);
  const periods = usePayPeriodStore((s) => s.periods);
  const period = periods.find((p) => p.id === periodId);

  const tasks = useMemo(() => {
    const periodTasks = allTasks.filter((t) => t.payPeriodId === periodId);
    return filter === 'all' ? periodTasks : periodTasks.filter((t) => t.status === filter);
  }, [allTasks, periodId, filter]);

  const valueMap = useMemo(() => {
    if (!period) return new Map<string, number>();
    const activeTasks = allTasks.filter(
      (t) => t.payPeriodId === periodId && t.status === 'active'
    );
    const remainingBudget = period.lockedAmount - period.unlockedAmount;
    return calculateTaskValues(activeTasks, remainingBudget, period.lockedAmount);
  }, [allTasks, periodId, period]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const key = task.category || 'Uncategorized';
      const list = groups.get(key) ?? [];
      list.push(task);
      groups.set(key, list);
    }
    // Sort: named categories alphabetically, "Uncategorized" last
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
  }, [tasks]);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((category: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const allCollapsed = grouped.length > 0 && grouped.every(([cat]) => collapsed.has(cat));

  const toggleAll = useCallback(() => {
    if (allCollapsed) {
      setCollapsed(new Set());
    } else {
      setCollapsed(new Set(grouped.map(([cat]) => cat)));
    }
  }, [allCollapsed, grouped]);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<ListTodo size={40} />}
        title={filter === 'active' ? 'No active tasks' : `No ${filter} tasks`}
        description={filter === 'active' ? 'Create a task to start unlocking your money.' : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {grouped.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={toggleAll}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <ChevronsUpDown size={14} />
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>
        </div>
      )}
      {grouped.map(([category, categoryTasks]) => {
        const isCollapsed = collapsed.has(category);
        return (
          <div key={category} className="flex flex-col gap-2">
            <button
              onClick={() => toggleCategory(category)}
              className="relative flex items-center justify-center w-full px-4 py-3 rounded-xl bg-surface-light cursor-pointer group hover:bg-surface-light/80 transition-colors"
            >
              <div className="absolute left-4">
                {isCollapsed ? (
                  <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                ) : (
                  <ChevronDown size={16} className="text-text-muted group-hover:text-text-primary transition-colors" />
                )}
              </div>
              <h3 className="text-base font-extrabold text-text-primary">{category}</h3>
              <span className="absolute right-4 text-xs font-medium text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{categoryTasks.length}</span>
            </button>
            {!isCollapsed && categoryTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                computedValue={task.status === 'active' ? valueMap.get(task.id) ?? 0 : task.dollarValue}
                onComplete={() => onCompleteTask(task.id)}
                onEdit={() => onEditTask(task.id)}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
