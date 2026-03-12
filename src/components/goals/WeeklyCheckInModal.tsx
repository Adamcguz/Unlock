import { useState, useRef, useMemo } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useGoalStore } from '../../store/useGoalStore';
import { Check, SkipForward } from 'lucide-react';

export function WeeklyCheckInModal() {
  const goals = useGoalStore((s) => s.goals);
  const lastWeeklyPromptAt = useGoalStore((s) => s.lastWeeklyPromptAt);
  const setLastWeeklyPromptAt = useGoalStore((s) => s.setLastWeeklyPromptAt);
  const addCheckIn = useGoalStore((s) => s.addCheckIn);

  const goalsNeedingCheckIn = useMemo(() => {
    const now = new Date();
    return goals.filter((g) => {
      if (g.type !== 'numeric' || g.status !== 'active') return false;
      if (!g.lastCheckInAt) return true;
      return differenceInCalendarDays(now, new Date(g.lastCheckInAt)) >= 7;
    });
  }, [goals]);

  const dismissedRef = useRef(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState(false);

  const shouldShow =
    !dismissed &&
    !dismissedRef.current &&
    goalsNeedingCheckIn.length > 0 &&
    (lastWeeklyPromptAt === null || differenceInCalendarDays(new Date(), new Date(lastWeeklyPromptAt)) >= 7);

  if (!shouldShow) return null;

  const handleUpdateAll = () => {
    for (const goal of goalsNeedingCheckIn) {
      const raw = values[goal.id];
      if (raw !== undefined && raw !== '') {
        const numVal = parseFloat(raw);
        if (!isNaN(numVal)) {
          addCheckIn(goal.id, numVal);
        }
      }
    }
    setLastWeeklyPromptAt(new Date().toISOString());
    dismissedRef.current = true;
    setDismissed(true);
  };

  const handleSkip = () => {
    setLastWeeklyPromptAt(new Date().toISOString());
    dismissedRef.current = true;
    setDismissed(true);
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleSkip}
      title="Weekly Check-in"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Time for a progress update! Enter your current values below.
        </p>

        {goalsNeedingCheckIn.map((goal) => (
          <div key={goal.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">{goal.name}</span>
              <span className="text-xs text-text-muted">
                Current: {goal.currentValue} {goal.unit}
              </span>
            </div>
            <Input
              type="number"
              step="any"
              placeholder={`New value (${goal.unit})`}
              value={values[goal.id] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [goal.id]: e.target.value }))}
            />
          </div>
        ))}

        <div className="flex gap-2">
          <Button className="flex-1" icon={<Check size={16} />} onClick={handleUpdateAll}>
            Update All
          </Button>
          <Button variant="ghost" icon={<SkipForward size={16} />} onClick={handleSkip}>
            Skip
          </Button>
        </div>
      </div>
    </Modal>
  );
}
