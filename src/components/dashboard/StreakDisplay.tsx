import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import { Card } from '../ui/Card';
import { useHistoryStore } from '../../store/useHistoryStore';
import { calculateStreak } from '../../lib/dateUtils';

export function StreakDisplay() {
  const entries = useHistoryStore((s) => s.entries);

  const streak = useMemo(() => {
    const completionDates = entries
      .filter((e) => e.type === 'unlocked')
      .map((e) => e.completedAt);
    return calculateStreak(completionDates);
  }, [entries]);

  if (streak.current === 0 && streak.longest === 0) {
    return null;
  }

  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
          <Flame size={22} className="text-orange-400" />
        </div>
        <div>
          <p className="font-bold text-lg">{streak.current} day streak</p>
          <p className="text-xs text-text-muted">
            {streak.longest > streak.current
              ? `Best: ${streak.longest} days`
              : 'Personal best!'}
          </p>
        </div>
      </div>
    </Card>
  );
}
