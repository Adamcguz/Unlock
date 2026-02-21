import { Unlock, PiggyBank, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CurrencyDisplay } from '../ui/CurrencyDisplay';
import { EmptyState } from '../ui/EmptyState';
import { formatDate } from '../../lib/dateUtils';
import { useHistoryStore } from '../../store/useHistoryStore';

export function HistoryLog() {
  const entries = useHistoryStore((s) => s.entries);
  const sorted = [...entries].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={40} />}
        title="No history yet"
        description="Complete tasks to see your history here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry) => (
        <Card key={entry.id} className="flex items-center gap-3 p-3">
          {entry.type === 'unlocked' ? (
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Unlock size={16} className="text-primary" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-savings/20 flex items-center justify-center shrink-0">
              <PiggyBank size={16} className="text-savings" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm">{entry.taskName}</p>
            <p className="text-xs text-text-muted">{formatDate(entry.completedAt)}</p>
          </div>
          <div className="text-right shrink-0">
            <CurrencyDisplay
              amount={entry.dollarValue}
              size="sm"
              className={entry.type === 'unlocked' ? 'text-primary' : 'text-savings'}
            />
            <Badge className={entry.type === 'unlocked' ? 'bg-primary/20 text-primary' : 'bg-savings/20 text-savings'}>
              {entry.type === 'unlocked' ? 'Unlocked' : 'Saved'}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
