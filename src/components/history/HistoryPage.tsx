import { useState } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { HistoryLog } from './HistoryLog';
import { CalendarView } from './CalendarView';

type Tab = 'log' | 'calendar';

const tabs: { value: Tab; label: string }[] = [
  { value: 'log', label: 'Log' },
  { value: 'calendar', label: 'Calendar' },
];

export function HistoryPage() {
  const [tab, setTab] = useState<Tab>('log');

  return (
    <PageContainer className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">History</h1>

      <div className="flex gap-2">
        {tabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
              ${tab === value
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:text-text-secondary'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'log' && <HistoryLog />}
      {tab === 'calendar' && <CalendarView />}
    </PageContainer>
  );
}
