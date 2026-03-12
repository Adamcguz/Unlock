import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useGoalStore } from '../../store/useGoalStore';
import type { Goal } from '../../types';

interface GoalProgressChartProps {
  goal: Goal;
}

export function GoalProgressChart({ goal }: GoalProgressChartProps) {
  const getCheckIns = useGoalStore((s) => s.getCheckInsForGoal);

  const data = useMemo(() => {
    const checkIns = getCheckIns(goal.id);
    const points = [
      { date: format(new Date(goal.createdAt), 'MMM d'), value: goal.startValue ?? 0 },
      ...checkIns.map((c) => ({
        date: format(new Date(c.createdAt), 'MMM d'),
        value: c.value,
      })),
    ];
    return points;
  }, [goal, getCheckIns]);

  if (data.length < 2) {
    return (
      <p className="text-sm text-text-muted text-center py-4">
        Log a check-in to see your progress chart.
      </p>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: 'none',
              borderRadius: '0.75rem',
              fontSize: '0.75rem',
            }}
            formatter={(value) => [`${value ?? 0} ${goal.unit ?? ''}`, 'Value']}
          />
          {goal.targetValue !== null && (
            <ReferenceLine
              y={goal.targetValue}
              stroke="#22c55e"
              strokeDasharray="4 4"
              label={{ value: `Target: ${goal.targetValue}`, fill: '#22c55e', fontSize: 11, position: 'right' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
