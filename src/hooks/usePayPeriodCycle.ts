import { useEffect } from 'react';
import { usePayPeriodStore } from '../store/usePayPeriodStore';
import { useTaskStore } from '../store/useTaskStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useUserStore } from '../store/useUserStore';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { useProjectStore } from '../store/useProjectStore';
import { startOfDay, parseISO } from 'date-fns';
import { isPeriodExpired, getNextPeriodDates, getNextPeriodStartDate, isNewDay, isNewWeek, isNewMonth } from '../lib/dateUtils';

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
        const lockedAmount = useUserStore.getState().getLockedAmountForPeriod(
          new Date(startDate), new Date(endDate)
        );
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

    function generateSubPeriodTasks() {
      const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
      if (!currentPeriod || currentPeriod.status !== 'active') return;

      const templates = useRecurringTaskStore.getState().templates.filter(
        (t) => t.isActive && t.frequency !== 'every-period'
      );

      const today = new Date().toISOString();

      for (const template of templates) {
        // Initialize tracking for templates that don't have a lastGeneratedDate yet
        if (!template.lastGeneratedDate) {
          useRecurringTaskStore.getState().markGeneratedDate(template.id, today);
          continue;
        }

        const shouldGenerate =
          (template.frequency === 'daily' && isNewDay(template.lastGeneratedDate)) ||
          (template.frequency === 'weekly' && isNewWeek(template.lastGeneratedDate)) ||
          (template.frequency === 'monthly' && isNewMonth(template.lastGeneratedDate));

        if (!shouldGenerate) continue;

        const count = template.timesPerPeriod ?? 1;
        for (let i = 0; i < count; i++) {
          const task = useTaskStore.getState().createTask({
            payPeriodId: currentPeriod.id,
            name: template.name,
            difficulty: template.difficulty,
            dueDate: null,
            notes: template.notes,
            recurringTemplateId: template.id,
            category: template.category,
          });
          usePayPeriodStore.getState().addTaskToPeriod(currentPeriod.id, task.id);
        }
        useRecurringTaskStore.getState().markGeneratedDate(template.id, today);
      }
    }

    function spawnProjectTasks() {
      const currentPeriod = usePayPeriodStore.getState().getCurrentPeriod();
      if (!currentPeriod || currentPeriod.status !== 'active') return;

      const today = startOfDay(new Date());
      const projects = useProjectStore.getState().projects.filter(
        (p) => p.status === 'active'
      );

      for (const project of projects) {
        for (const pt of project.tasks) {
          if (pt.status !== 'pending') continue;
          const assignedDate = startOfDay(parseISO(pt.assignedDate));
          if (assignedDate > today) continue;

          const task = useTaskStore.getState().createTask({
            payPeriodId: currentPeriod.id,
            name: pt.name,
            difficulty: pt.difficulty,
            dueDate: pt.assignedDate,
            notes: pt.notes,
            category: project.name,
            projectId: project.id,
          });
          usePayPeriodStore.getState().addTaskToPeriod(currentPeriod.id, task.id);
          useProjectStore.getState().markTaskSpawned(project.id, pt.id, task.id);
        }
      }
    }

    checkAndTransition();
    generateSubPeriodTasks();
    spawnProjectTasks();
    const interval = setInterval(() => {
      checkAndTransition();
      generateSubPeriodTasks();
      spawnProjectTasks();
    }, 60000);
    return () => clearInterval(interval);
  }, []);
}
