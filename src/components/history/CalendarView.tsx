import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useTaskStore } from '../../store/useTaskStore';
import { getMonthDays, isSameDay, format } from '../../lib/dateUtils';
import { getDifficultyLabel, getDifficultyColor } from '../../lib/constants';
import type { HistoryEntry } from '../../types';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const entries = useHistoryStore((s) => s.entries);
  const tasks = useTaskStore((s) => s.tasks);

  const unlockedEntries = useMemo(
    () => entries.filter((e) => e.type === 'unlocked'),
    [entries]
  );

  const completionDateObjects = useMemo(
    () => unlockedEntries.map((e) => new Date(e.completedAt)),
    [unlockedEntries]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);
  const firstDayOfWeek = days[0].getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const hasCompletion = (day: Date) =>
    completionDateObjects.some((d) => isSameDay(d, day));

  const getEntriesForDay = (day: Date): HistoryEntry[] =>
    unlockedEntries.filter((e) => isSameDay(new Date(e.completedAt), day));

  const selectedEntries = useMemo(
    () => (selectedDay ? getEntriesForDay(selectedDay) : []),
    [selectedDay, unlockedEntries]
  );

  const difficultyBreakdown = useMemo(() => {
    const groups: Record<string, { label: string; color: string; count: number; totalValue: number }> = {};
    for (const entry of selectedEntries) {
      // Use stored difficulty, or look up from the task if not present (old entries)
      let d = entry.difficulty;
      if (d == null) {
        const task = tasks.find((t) => t.id === entry.taskId);
        d = task?.difficulty ?? 5;
      }
      const label = getDifficultyLabel(d);
      if (!groups[label]) {
        groups[label] = { label, color: getDifficultyColor(d), count: 0, totalValue: 0 };
      }
      groups[label].count++;
      groups[label].totalValue += entry.dollarValue;
    }
    return Object.values(groups);
  }, [selectedEntries, tasks]);

  const handleDayClick = (day: Date) => {
    if (hasCompletion(day)) {
      setSelectedDay((prev) => (prev && isSameDay(prev, day) ? null : day));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1 text-text-muted hover:text-text-primary cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <span className="font-medium">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="p-1 text-text-muted hover:text-text-primary cursor-pointer">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-xs text-text-muted py-1 font-medium">
              {d}
            </div>
          ))}

          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {days.map((day) => {
            const completed = hasCompletion(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDay && isSameDay(day, selectedDay);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDayClick(day)}
                className={`
                  relative py-2 rounded-lg text-sm transition-colors
                  ${completed ? 'cursor-pointer' : 'cursor-default'}
                  ${isToday ? 'ring-1 ring-primary' : ''}
                  ${isSelected ? 'bg-primary/30 text-primary font-bold' : completed ? 'bg-primary/20 text-primary font-medium' : 'text-text-secondary'}
                `}
              >
                {day.getDate()}
                {completed && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {selectedDay && selectedEntries.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              {format(selectedDay, 'MMMM d, yyyy')}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-text-muted mb-3">
            {selectedEntries.length} task{selectedEntries.length !== 1 ? 's' : ''} completed
          </p>

          <div className="flex flex-col gap-2 mb-3">
            {difficultyBreakdown.map((group) => (
              <div key={group.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={group.color}>{group.label}</Badge>
                  <span className="text-sm text-text-secondary">
                    x{group.count}
                  </span>
                </div>
                <CurrencyDisplay amount={group.totalValue} size="sm" className="text-primary" />
              </div>
            ))}
          </div>

          <div className="border-t border-surface-light pt-2 flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Total unlocked</span>
            <CurrencyDisplay
              amount={selectedEntries.reduce((sum, e) => sum + e.dollarValue, 0)}
              size="sm"
              className="text-primary font-bold"
            />
          </div>
        </Card>
      )}
    </div>
  );
}
