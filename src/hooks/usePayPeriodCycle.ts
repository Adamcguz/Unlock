import { useEffect } from 'react';
import { usePayPeriodStore } from '../store/usePayPeriodStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useUserStore } from '../store/useUserStore';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { isPeriodExpired, getNextPeriodDates, getNextPeriodStartDate } from '../lib/dateUtils';

export function usePayPeriodCycle() {
  useEffect(() => {
    function checkAndTransition() {
      const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
      const profile = useUserStore.getState().profile;
      if (!currentPeriod || !profile) return;

      if (isPeriodExpired(currentPeriod.endDate)) {
        // Expire remaining active tasks
        const expiredTasks = useTaskStore.getState().expireTasksForPeriod(currentPeriod.id);

        // Savings = locked amount minus what was unlocked by completing tasks
        const savedAmount = Math.max(0, currentPeriod.lockedAmount - currentPeriod.unlockedAmount);

        // Record savings as a history entry so it appears in all-time stats
        if (savedAmount > 0) {
          useHistoryStore.getState().addEntry({
            taskId: currentPeriod.id,
            taskName: 'Period savings',
            difficulty: 0,
            dollarValue: savedAmount,
            completedAt: new Date().toISOString(),
            payPeriodId: currentPeriod.id,
            type: 'saved',
          });
        }

        // Add period summary
        const allTasks = useTaskStore.getState().getTasksByPeriod(currentPeriod.id);
        useHistoryStore.getState().addPeriodSummary({
          payPeriodId: currentPeriod.id,
          startDate: currentPeriod.startDate,
          endDate: currentPeriod.endDate,
          totalLocked: currentPeriod.lockedAmount,
          totalUnlocked: currentPeriod.unlockedAmount,
          totalSaved: savedAmount,
          tasksCompleted: allTasks.filter((t) => t.status === 'completed').length,
          tasksExpired: expiredTasks.length,
          tasksTotal: allTasks.length,
        });

        // Complete the period
        usePayPeriodStore.getState().completePeriod(currentPeriod.id, savedAmount);

        // Create new period — chain from current period end
        const nextStart = getNextPeriodStartDate(profile.paySchedule, currentPeriod.endDate);
        const { startDate, endDate } = getNextPeriodDates(profile.paySchedule, nextStart);
        const lockedAmount = useUserStore.getState().getLockedAmountPerPeriod();
        const newPeriod = usePayPeriodStore.getState().createPeriod(startDate, endDate, lockedAmount);

        // Auto-create recurring tasks for the new period
        const templates = useRecurringTaskStore.getState().templates
          .filter((t) => t.isActive && t.lastGeneratedPeriodId !== newPeriod.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

        for (const template of templates) {
          const count = template.timesPerPeriod ?? 1;
          for (let i = 0; i < count; i++) {
            const task = useTaskStore.getState().createTask({
              payPeriodId: newPeriod.id,
              name: template.name,
              difficulty: template.difficulty,
              dueDate: null,
              notes: template.notes,
              recurringTemplateId: template.id,
              category: template.category,
            });
            usePayPeriodStore.getState().addTaskToPeriod(newPeriod.id, task.id);
          }
          useRecurringTaskStore.getState().markGenerated(template.id, newPeriod.id);
        }
      }
    }

    checkAndTransition();
    const interval = setInterval(checkAndTransition, 60000);
    return () => clearInterval(interval);
  }, []);
}
