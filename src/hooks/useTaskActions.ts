import { useCallback, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { usePayPeriodStore } from '../store/usePayPeriodStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { calculateTaskValues } from '../lib/calculations';
import type { Task } from '../types';

export function useTaskActions() {
  const [celebratingTask, setCelebratingTask] = useState<Task | null>(null);

  const handleCompleteTask = useCallback((taskId: string) => {
    const taskStore = useTaskStore.getState();
    const task = taskStore.tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'active') return;

    const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
    if (!currentPeriod) return;

    const activeTasks = taskStore.tasks.filter(
      (t) => t.payPeriodId === currentPeriod.id && t.status === 'active'
    );
    const remainingBudget = currentPeriod.lockedAmount - currentPeriod.unlockedAmount;
    const valueMap = calculateTaskValues(activeTasks, remainingBudget, currentPeriod.lockedAmount);
    const computedValue = valueMap.get(taskId) ?? 0;

    taskStore.completeTask(taskId, computedValue);
    usePayPeriodStore.getState().updatePeriodUnlocked(currentPeriod.id, computedValue);

    useHistoryStore.getState().addEntry({
      taskId: task.id,
      taskName: task.name,
      difficulty: task.difficulty,
      dollarValue: computedValue,
      completedAt: new Date().toISOString(),
      payPeriodId: task.payPeriodId,
      type: 'unlocked',
    });

    setCelebratingTask({ ...task, status: 'completed', completedAt: new Date().toISOString(), dollarValue: computedValue });
    return task;
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebratingTask(null);
  }, []);

  return { handleCompleteTask, celebratingTask, dismissCelebration };
}
