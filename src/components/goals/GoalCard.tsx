import { useMemo } from 'react';
import { TrendingUp, Flame, ChevronRight, BarChart3 } from 'lucide-react';
import { differenceInCalendarDays, startOfDay, isSameDay } from 'date-fns';
import { Badge } from '../ui/Badge';
import { useHistoryStore } from '../../store/useHistoryStore';
import type { Goal } from '../../types';

interface GoalCardProps {
  goal: Goal;
  onSelect: () => void;
  onLogCheckIn?: () => void;
}

function getProgress(goal: Goal): number {
  if (goal.startValue == null || goal.targetValue == null || goal.currentValue == null) return 0;
  const total = Math.abs(goal.targetValue - goal.startValue);
  if (total === 0) return 1;
  const progress = Math.abs(goal.currentValue - goal.startValue);
  return Math.min(1, progress / total);
}

export function GoalCard({ goal, onSelect, onLogCheckIn }: GoalCardProps) {
  const entries = useHistoryStore((s) => s.entries);

  const habitStats = useMemo(() => {
    if (goal.type !== 'habit') return null;
    const matching = entries.filter((e) => {
      if (e.type !== 'unlocked') return false;
      if (goal.link.type === 'category') return e.category === goal.link.category;
      if (goal.link.type === 'templates') return goal.link.templateIds?.includes(e.recurringTemplateId ?? '');
      return false;
    });
    // Current streak
    const dates = [...new Set(matching.map((e) => startOfDay(new Date(e.completedAt)).toISOString()))].sort().reverse();
    let streak = 0;
    const today = startOfDay(new Date());
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (isSameDay(new Date(dates[i]), expected)) {
        streak++;
      } else {
        break;
      }
    }
    const daysSinceCreation = Math.max(1, differenceInCalendarDays(new Date(), new Date(goal.createdAt)));
    const uniqueDays = new Set(matching.map((e) => startOfDay(new Date(e.completedAt)).toISOString())).size;
    const rate = Math.round((uniqueDays / daysSinceCreation) * 100);
    return { streak, rate, total: matching.length };
  }, [goal, entries]);

  const isCompleted = goal.status === 'completed';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      className={`w-full text-left bg-surface-light rounded-xl p-4 transition-colors hover:bg-surface-light/80 cursor-pointer ${
        isCompleted ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {goal.type === 'numeric' ? (
              <TrendingUp size={16} className="text-primary shrink-0" />
            ) : (
              <Flame size={16} className="text-orange-400 shrink-0" />
            )}
            <h3 className="font-semibold text-text-primary truncate">{goal.name}</h3>
          </div>

          {goal.type === 'numeric' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>{goal.currentValue} {goal.unit}</span>
                <span>{goal.targetValue} {goal.unit}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${getProgress(goal) * 100}%` }}
                />
              </div>
              <div className="text-xs text-text-muted mt-1">
                {Math.round(getProgress(goal) * 100)}% complete
              </div>
            </div>
          )}

          {goal.type === 'habit' && habitStats && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Flame size={12} className="text-orange-400" />
                <span>{habitStats.streak} day streak</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <BarChart3 size={12} />
                <span>{habitStats.rate}% rate</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Badge className={goal.type === 'numeric' ? 'bg-primary/20 text-primary' : 'bg-orange-500/20 text-orange-400'}>
              {goal.type === 'numeric' ? 'Numeric' : 'Habit'}
            </Badge>
            {goal.link.type === 'category' && goal.link.category && (
              <Badge className="bg-white/5 text-text-muted">{goal.link.category}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 mt-1">
          {goal.type === 'numeric' && !isCompleted && onLogCheckIn && (
            <button
              onClick={(e) => { e.stopPropagation(); onLogCheckIn(); }}
              className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
            >
              Log
            </button>
          )}
          <ChevronRight size={18} className="text-text-muted" />
        </div>
      </div>
    </div>
  );
}
