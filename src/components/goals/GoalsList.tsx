import { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { GoalCard } from './GoalCard';
import { CreateGoalForm } from './CreateGoalForm';
import { LogCheckInForm } from './LogCheckInForm';
import { useGoalStore } from '../../store/useGoalStore';
import type { Goal } from '../../types';

interface GoalsListProps {
  onSelectGoal: (id: string) => void;
}

export function GoalsList({ onSelectGoal }: GoalsListProps) {
  const goals = useGoalStore((s) => s.goals);
  const [showCreate, setShowCreate] = useState(false);
  const [checkInGoal, setCheckInGoal] = useState<Goal | null>(null);

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed' || g.status === 'archived');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Your Goals</h2>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<Target size={40} />}
          title="No goals yet"
          description="Set goals and link them to your tasks to track real progress."
          action={
            <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
              Create Goal
            </Button>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <div className="flex flex-col gap-2">
              {active.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onSelect={() => onSelectGoal(g.id)}
                  onLogCheckIn={g.type === 'numeric' ? () => setCheckInGoal(g) : undefined}
                />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-text-muted mt-2">Completed / Archived</h3>
              {completed.map((g) => (
                <GoalCard key={g.id} goal={g} onSelect={() => onSelectGoal(g.id)} />
              ))}
            </div>
          )}
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Goal">
        <CreateGoalForm onCreated={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!checkInGoal} onClose={() => setCheckInGoal(null)} title="Log Progress">
        {checkInGoal && (
          <LogCheckInForm goal={checkInGoal} onDone={() => setCheckInGoal(null)} />
        )}
      </Modal>
    </div>
  );
}
