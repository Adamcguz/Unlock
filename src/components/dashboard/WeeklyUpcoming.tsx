import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useProjectStore } from '../../store/useProjectStore';
import { getDifficultyLabel, getDifficultyColor } from '../../lib/constants';

interface WeekTask {
  id: string;
  name: string;
  difficulty: number;
  assignedDate: string;
  projectName: string;
  status: 'pending' | 'spawned' | 'completed';
}

export function WeeklyUpcoming() {
  const projects = useProjectStore((s) => s.projects);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const today = new Date();
    const base = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const weekTasks = useMemo(() => {
    const tasks: WeekTask[] = [];
    const weekEnd = addDays(weekStart, 6);

    for (const project of projects) {
      if (project.status !== 'active') continue;
      for (const pt of project.tasks) {
        if (pt.status === 'completed') continue;
        const date = new Date(pt.assignedDate);
        if (date >= weekStart && date <= weekEnd) {
          tasks.push({
            id: pt.id,
            name: pt.name,
            difficulty: pt.difficulty,
            assignedDate: pt.assignedDate,
            projectName: project.name,
            status: pt.status,
          });
        }
      }
    }

    return tasks.sort((a, b) => a.assignedDate.localeCompare(b.assignedDate));
  }, [projects, weekStart]);

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const tasksForDay = useMemo(() => {
    if (!selectedDay) return weekTasks;
    return weekTasks.filter((t) => isSameDay(new Date(t.assignedDate), selectedDay));
  }, [weekTasks, selectedDay]);

  const taskCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of weekTasks) {
      const key = t.assignedDate.slice(0, 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [weekTasks]);

  const today = new Date();
  const isCurrentWeek = weekOffset === 0;
  const weekLabel = isCurrentWeek
    ? 'This Week'
    : weekOffset === 1
      ? 'Next Week'
      : weekOffset === -1
        ? 'Last Week'
        : `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d')}`;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          <h3 className="font-semibold text-text-primary text-sm">{weekLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1 rounded-lg hover:bg-surface-light transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} className="text-text-muted" />
          </button>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary px-2 py-0.5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1 rounded-lg hover:bg-surface-light transition-colors cursor-pointer"
          >
            <ChevronRight size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      {/* Day strip */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const count = taskCountByDay.get(dateKey) ?? 0;
          const isToday = isSameDay(day, today);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`flex flex-col items-center py-1.5 px-0.5 rounded-xl transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-primary/20 ring-1 ring-primary'
                  : isToday
                    ? 'bg-primary/10'
                    : 'hover:bg-surface-light'
              }`}
            >
              <span className="text-[10px] text-text-muted uppercase font-medium">
                {format(day, 'EEE')}
              </span>
              <span
                className={`text-sm font-semibold mt-0.5 ${
                  isToday ? 'text-primary' : 'text-text-primary'
                }`}
              >
                {format(day, 'd')}
              </span>
              {count > 0 && (
                <div className="flex items-center gap-0.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {count > 1 && (
                    <span className="text-[9px] text-primary font-medium">{count}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      {tasksForDay.length > 0 ? (
        <div className="flex flex-col gap-2">
          {tasksForDay.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-surface-light/50 rounded-lg px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary truncate">{task.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-text-muted truncate">
                    {task.projectName}
                  </span>
                  {!selectedDay && (
                    <span className="text-[11px] text-text-muted">
                      · {format(new Date(task.assignedDate), 'EEE')}
                    </span>
                  )}
                </div>
              </div>
              <Badge className={getDifficultyColor(task.difficulty)}>
                {getDifficultyLabel(task.difficulty)}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-muted text-center py-2">
          {selectedDay
            ? 'No tasks scheduled for this day'
            : 'No project tasks scheduled this week'}
        </p>
      )}
    </Card>
  );
}
