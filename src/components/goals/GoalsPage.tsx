import { useState } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { GoalsList } from './GoalsList';
import { GoalDetail } from './GoalDetail';
import { WeeklyCheckInModal } from './WeeklyCheckInModal';
import { HistoryLog } from '../history/HistoryLog';
import { useGoalStore } from '../../store/useGoalStore';

type Tab = 'goals' | 'log';

const tabs: { value: Tab; label: string }[] = [
  { value: 'goals', label: 'Goals' },
  { value: 'log', label: 'Log' },
];

export function GoalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('goals');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const goals = useGoalStore((s) => s.goals);
  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;

  if (selectedGoal) {
    return (
      <PageContainer className="flex flex-col gap-4">
        <GoalDetail goal={selectedGoal} onBack={() => setSelectedGoalId(null)} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Progress</h1>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'bg-surface-light text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'goals' ? (
        <GoalsList onSelectGoal={setSelectedGoalId} />
      ) : (
        <HistoryLog />
      )}

      <WeeklyCheckInModal />
    </PageContainer>
  );
}
