import { useMemo } from 'react';
import { Flame, BarChart3, CheckCircle2, Calendar } from 'lucide-react';
import { differenceInCalendarDays, startOfDay, isSameDay, format } from 'date-fns';
import { useHistoryStore } from '../../store/useHistoryStore';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import type { Goal } from '../../types';

interface HabitGoalStatsProps {
  goal: Goal;
}

export function HabitGoalStats({ goal }: HabitGoalStatsProps) {
  const entries = useHistoryStore((s) => s.entries);
  const currentPeriodId = usePayPeriodStore((s) => s.currentPeriodId);

  const stats = useMemo(() => {
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

    // Completion rate
    const daysSinceCreation = Math.max(1, differenceInCalendarDays(new Date(), new Date(goal.createdAt)));
    const uniqueDays = new Set(matching.map((e) => startOfDay(new Date(e.completedAt)).toISOString())).size;
    const rate = Math.round((uniqueDays / daysSinceCreation) * 100);

    // This period count
    const periodCount = matching.filter((e) => e.payPeriodId === currentPeriodId).length;

    // Recent completions (last 10)
    const recent = [...matching]
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 10);

    return { streak, rate, uniqueDays, daysSinceCreation, periodCount, total: matching.length, recent };
  }, [goal, entries, currentPeriodId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-light rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Flame size={18} className="text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{stats.streak}</p>
            <p className="text-xs text-text-muted">Day Streak</p>
          </div>
        </div>
        <div className="bg-surface-light rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{stats.rate}%</p>
            <p className="text-xs text-text-muted">Consistency</p>
          </div>
        </div>
        <div className="bg-surface-light rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{stats.periodCount}</p>
            <p className="text-xs text-text-muted">This Period</p>
          </div>
        </div>
        <div className="bg-surface-light rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Calendar size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">{stats.total}</p>
            <p className="text-xs text-text-muted">All Time</p>
          </div>
        </div>
      </div>

      {stats.recent.length > 0 && (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-text-secondary">Recent Activity</h4>
          {stats.recent.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-text-primary truncate">{entry.taskName}</span>
              <span className="text-xs text-text-muted shrink-0 ml-2">
                {format(new Date(entry.completedAt), 'MMM d')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
