import { useMemo } from 'react';
import { TrendingUp, PiggyBank, CheckSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { useHistoryStore } from '../../store/useHistoryStore';
import { calculateStreak } from '../../lib/dateUtils';

export function QuickStats() {
  const entries = useHistoryStore((s) => s.entries);

  const stats = useMemo(() => {
    const unlocked = entries
      .filter((e) => e.type === 'unlocked')
      .reduce((sum, e) => sum + e.dollarValue, 0);
    const saved = entries
      .filter((e) => e.type === 'saved')
      .reduce((sum, e) => sum + e.dollarValue, 0);
    const completionDates = entries
      .filter((e) => e.type === 'unlocked')
      .map((e) => e.completedAt);
    const streak = calculateStreak(completionDates);
    return {
      totalUnlocked: unlocked,
      totalSaved: saved,
      totalTasksCompleted: entries.filter((e) => e.type === 'unlocked').length,
      currentStreak: streak.current,
      longestStreak: streak.longest,
    };
  }, [entries]);

  if (stats.totalTasksCompleted === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-text-secondary">All-time Stats</h3>
      <div className="grid grid-cols-3 gap-2">
        <Card className="text-center p-3">
          <TrendingUp size={18} className="text-primary mx-auto mb-1" />
          <CurrencyDisplay amount={stats.totalUnlocked} size="sm" className="text-primary" />
          <p className="text-xs text-text-muted mt-0.5">Unlocked</p>
        </Card>
        <Card className="text-center p-3">
          <PiggyBank size={18} className="text-savings mx-auto mb-1" />
          <CurrencyDisplay amount={stats.totalSaved} size="sm" className="text-savings" />
          <p className="text-xs text-text-muted mt-0.5">Saved</p>
        </Card>
        <Card className="text-center p-3">
          <CheckSquare size={18} className="text-primary mx-auto mb-1" />
          <span className="font-bold text-lg">{stats.totalTasksCompleted}</span>
          <p className="text-xs text-text-muted mt-0.5">Tasks Done</p>
        </Card>
      </div>
    </div>
  );
}
