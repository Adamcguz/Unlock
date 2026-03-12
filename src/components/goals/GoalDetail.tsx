import { useState } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Pencil, Trash2, Archive, CheckCircle2, TrendingUp, Flame } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { GoalProgressChart } from './GoalProgressChart';
import { HabitGoalStats } from './HabitGoalStats';
import { LogCheckInForm } from './LogCheckInForm';
import { useGoalStore } from '../../store/useGoalStore';
import type { Goal } from '../../types';

interface GoalDetailProps {
  goal: Goal;
  onBack: () => void;
}

function getProgress(goal: Goal): number {
  if (goal.startValue == null || goal.targetValue == null || goal.currentValue == null) return 0;
  const total = Math.abs(goal.targetValue - goal.startValue);
  if (total === 0) return 1;
  const progress = Math.abs(goal.currentValue - goal.startValue);
  return Math.min(1, progress / total);
}

export function GoalDetail({ goal, onBack }: GoalDetailProps) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const getCheckIns = useGoalStore((s) => s.getCheckInsForGoal);
  const completeGoal = useGoalStore((s) => s.completeGoal);
  const archiveGoal = useGoalStore((s) => s.archiveGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);

  const checkIns = getCheckIns(goal.id);
  const isActive = goal.status === 'active';

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer self-start"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="bg-surface-light rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {goal.type === 'numeric' ? (
              <TrendingUp size={20} className="text-primary" />
            ) : (
              <Flame size={20} className="text-orange-400" />
            )}
            <h2 className="text-xl font-bold text-text-primary">{goal.name}</h2>
          </div>
          <Badge className={
            goal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
            goal.status === 'archived' ? 'bg-white/5 text-text-muted' :
            'bg-primary/20 text-primary'
          }>
            {goal.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-white/5 text-text-muted">
            {goal.link.type === 'category' ? goal.link.category : `${goal.link.templateIds?.length ?? 0} tasks`}
          </Badge>
          <span className="text-xs text-text-muted">
            Created {format(new Date(goal.createdAt), 'MMM d, yyyy')}
          </span>
        </div>

        {goal.type === 'numeric' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{goal.currentValue} {goal.unit}</span>
              <span className="text-text-muted">Target: {goal.targetValue} {goal.unit}</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${getProgress(goal) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1">{Math.round(getProgress(goal) * 100)}% complete</p>
          </div>
        )}
      </div>

      {goal.type === 'numeric' && (
        <>
          {isActive && (
            <Button icon={<Pencil size={16} />} onClick={() => setShowCheckIn(true)}>
              Log Progress
            </Button>
          )}

          <div className="bg-surface-light rounded-xl p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Progress Over Time</h3>
            <GoalProgressChart goal={goal} />
          </div>

          {checkIns.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Check-in History</h3>
              {[...checkIns].reverse().map((c) => (
                <div key={c.id} className="bg-surface-light rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{c.value} {goal.unit}</p>
                    {c.note && <p className="text-xs text-text-muted mt-0.5">{c.note}</p>}
                  </div>
                  <span className="text-xs text-text-muted">{format(new Date(c.createdAt), 'MMM d, yyyy')}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {goal.type === 'habit' && <HabitGoalStats goal={goal} />}

      {isActive && (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<CheckCircle2 size={14} />} onClick={() => { completeGoal(goal.id); onBack(); }}>
            Complete
          </Button>
          <Button variant="ghost" size="sm" icon={<Archive size={14} />} onClick={() => { archiveGoal(goal.id); onBack(); }}>
            Archive
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => { deleteGoal(goal.id); onBack(); }}>
            Delete
          </Button>
        </div>
      )}

      <Modal isOpen={showCheckIn} onClose={() => setShowCheckIn(false)} title="Log Progress">
        <LogCheckInForm goal={goal} onDone={() => setShowCheckIn(false)} />
      </Modal>
    </div>
  );
}
