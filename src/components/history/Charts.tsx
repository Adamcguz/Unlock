import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { useHistoryStore } from '../../store/useHistoryStore';
import { formatShortDate } from '../../lib/dateUtils';
import { BarChart2 } from 'lucide-react';

export function Charts() {
  const periodSummaries = useHistoryStore((s) => s.periodSummaries);

  if (periodSummaries.length === 0) {
    return (
      <EmptyState
        icon={<BarChart2 size={40} />}
        title="No data yet"
        description="Complete a pay period to see charts."
      />
    );
  }

  const barData = periodSummaries.slice(-6).map((s) => ({
    name: formatShortDate(s.startDate),
    Unlocked: s.totalUnlocked,
    Saved: s.totalSaved,
  }));

  let cumUnlocked = 0;
  let cumSaved = 0;
  const lineData = periodSummaries.map((s) => {
    cumUnlocked += s.totalUnlocked;
    cumSaved += s.totalSaved;
    return {
      name: formatShortDate(s.startDate),
      'Total Unlocked': cumUnlocked,
      'Total Saved': cumSaved,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Unlocked vs Saved by Period</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#F8FAFC' }}
            />
            <Bar dataKey="Unlocked" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saved" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <h3 className="text-sm font-medium text-text-secondary mb-3">Cumulative Totals</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#F8FAFC' }}
            />
            <Line type="monotone" dataKey="Total Unlocked" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Total Saved" stroke="#F59E0B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
