import { useCallback, useState } from 'react';
import { useTaskStore } from '../store/useTaskStore';
import { usePayPeriodStore } from '../store/usePayPeriodStore';
import { useRecurringTaskStore } from '../store/useRecurringTaskStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useProjectStore } from '../store/useProjectStore';
import { calculateTaskValues, getExpectedCompletions } from '../lib/calculations';
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
    const periodDays = Math.max(1, Math.round(
      (new Date(currentPeriod.endDate).getTime() - new Date(currentPeriod.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const templates = useRecurringTaskStore.getState().templates;
    const expected = new Map<string, number>();
    for (const t of templates) {
      expected.set(t.id, getExpectedCompletions(t.frequency, t.timesPerPeriod, periodDays));
    }
    const valueMap = calculateTaskValues(activeTasks, remainingBudget, currentPeriod.lockedAmount, expected);
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
      category: task.category,
      recurringTemplateId: task.recurringTemplateId,
    });

    // Sync project task completion
    if (task.projectId) {
      const projectStore = useProjectStore.getState();
      const project = projectStore.projects.find((p) => p.id === task.projectId);
      if (project) {
        const projectTask = project.tasks.find((pt) => pt.taskId === task.id);
        if (projectTask) {
          projectStore.markTaskCompleted(project.id, projectTask.id);
          // Auto-complete project if all tasks are done
          const updatedProject = useProjectStore.getState().projects.find((p) => p.id === project.id);
          if (updatedProject && updatedProject.tasks.length > 0 &&
              updatedProject.tasks.every((t) => t.status === 'completed')) {
            projectStore.completeProject(project.id);
          }
        }
      }
    }

    setCelebratingTask({ ...task, status: 'completed', completedAt: new Date().toISOString(), dollarValue: computedValue });
    return task;
  }, []);

  const dismissCelebration = useCallback(() => {
    setCelebratingTask(null);
  }, []);

  return { handleCompleteTask, celebratingTask, dismissCelebration };
}
