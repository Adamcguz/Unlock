import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui/Card';
import { useTaskStore } from '../../store/useTaskStore';
import { formatCurrency } from '../../lib/dateUtils';

interface DifficultyChartProps {
  periodId: string;
}

type ChartMode = 'difficulty' | 'category';

const DIFFICULTY_GROUPS = [
  { label: 'Easy', range: [1, 2], fill: '#22C55E' },
  { label: 'Moderate', range: [3, 4], fill: '#3B82F6' },
  { label: 'Medium', range: [5, 6], fill: '#EAB308' },
  { label: 'Hard', range: [7, 8], fill: '#F97316' },
  { label: 'Extreme', range: [9, 10], fill: '#EF4444' },
];

const CATEGORY_COLORS = [
  '#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1',
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: { count: number; value: number } }>; label?: string }) {
  if (!active || !payload?.[0]) return null;
  const { count, value } = payload[0].payload;
  return (
    <div className="bg-surface-light rounded-lg px-3 py-2 text-xs shadow-lg border border-white/5">
      <p className="font-medium text-text-primary">{label}</p>
      <p className="text-text-muted">{count} task{count !== 1 ? 's' : ''} — {formatCurrency(value)}</p>
    </div>
  );
}

export function DifficultyChart({ periodId }: DifficultyChartProps) {
  const allTasks = useTaskStore((s) => s.tasks);
  const [mode, setMode] = useState<ChartMode>('difficulty');

  const completed = useMemo(
    () => allTasks.filter((t) => t.payPeriodId === periodId && t.status === 'completed'),
    [allTasks, periodId]
  );

  const difficultyData = useMemo(() => {
    return DIFFICULTY_GROUPS
      .map(({ label, range, fill }) => {
        const matching = completed.filter((t) => t.difficulty >= range[0] && t.difficulty <= range[1]);
        return {
          label,
          count: matching.length,
          value: matching.reduce((sum, t) => sum + t.dollarValue, 0),
          fill,
        };
      })
      .filter((d) => d.count > 0);
  }, [completed]);

  const categoryData = useMemo(() => {
    const groups = new Map<string, { count: number; value: number }>();
    for (const task of completed) {
      const key = task.category || 'Uncategorized';
      const existing = groups.get(key) ?? { count: 0, value: 0 };
      existing.count += 1;
      existing.value += task.dollarValue;
      groups.set(key, existing);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
      })
      .map(([label, { count, value }], i) => ({
        label,
        count,
        value,
        fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));
  }, [completed]);

  const data = mode === 'difficulty' ? difficultyData : categoryData;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Completed This Period</h3>
        <div className="flex bg-surface-light rounded-lg p-0.5">
          <button
            onClick={() => setMode('difficulty')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              mode === 'difficulty'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Difficulty
          </button>
          <button
            onClick={() => setMode('category')}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              mode === 'category'
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            Category
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4">
          {mode === 'difficulty'
            ? 'No tasks completed yet. Finish a task to see your progress here.'
            : 'No categorized tasks completed yet.'}
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={[0, maxCount]}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
