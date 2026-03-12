import { PageContainer } from '../layout/PageContainer';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { DifficultyChart } from './DifficultyChart';
import { UnlockGuide } from './UnlockGuide';
import { QuickStats } from './QuickStats';
import { StreakDisplay } from './StreakDisplay';
import { PeriodProgressBar } from './PeriodProgressBar';
import { WeeklyUpcoming } from './WeeklyUpcoming';
import { EmptyState } from '../ui/EmptyState';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { AlertCircle } from 'lucide-react';

export function DashboardPage() {
  const periods = usePayPeriodStore((s) => s.periods);
  const currentPeriodId = usePayPeriodStore((s) => s.currentPeriodId);
  const currentPeriod = periods.find((p) => p.id === currentPeriodId) ?? null;

  if (!currentPeriod) {
    return (
      <PageContainer>
        <EmptyState
          icon={<AlertCircle size={40} />}
          title="No active pay period"
          description="Something went wrong. Try going to Settings and resetting your data, then complete onboarding again."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-4">
      <PeriodProgressBar period={currentPeriod} />
      <FinancialSummaryCard period={currentPeriod} />
      <WeeklyUpcoming />
      <DifficultyChart periodId={currentPeriod.id} />
      <UnlockGuide period={currentPeriod} />
      <StreakDisplay />
      <QuickStats />
    </PageContainer>
  );
}
