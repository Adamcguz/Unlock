import { useState } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { TaskList } from './TaskList';
import { TaskFilters, type TaskFilter } from './TaskFilters';
import { EditTaskForm } from './EditTaskForm';
import { RecurringTaskManager } from './RecurringTaskManager';
import { Modal } from '../ui/Modal';
import { UnlockAnimation } from '../celebrations/UnlockAnimation';
import { usePayPeriodStore } from '../../store/usePayPeriodStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useTaskActions } from '../../hooks/useTaskActions';
import type { Task, TaskStatus } from '../../types';

export function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>('active');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const periods = usePayPeriodStore((s) => s.periods);
  const currentPeriodId = usePayPeriodStore((s) => s.currentPeriodId);
  const currentPeriod = periods.find((p) => p.id === currentPeriodId) ?? null;
  const { handleCompleteTask, celebratingTask, dismissCelebration } = useTaskActions();

  const handleEditTask = (taskId: string) => {
    const task = useTaskStore.getState().tasks.find((t) => t.id === taskId);
    if (task) setEditingTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    useTaskStore.getState().deleteTask(taskId);
    if (currentPeriod) {
      usePayPeriodStore.getState().removeTaskFromPeriod(currentPeriod.id, taskId);
    }
  };

  if (!currentPeriod) {
    return (
      <PageContainer>
        <p className="text-text-secondary text-center py-8">No active period.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Tasks</h1>

      <TaskFilters current={filter} onChange={setFilter} />

      {filter === 'recurring' ? (
        <RecurringTaskManager />
      ) : (
        <TaskList
          periodId={currentPeriod.id}
          filter={filter as TaskStatus | 'all'}
          onCompleteTask={handleCompleteTask}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
      >
        {editingTask && (
          <EditTaskForm
            task={editingTask}
            onSaved={() => setEditingTask(null)}
          />
        )}
      </Modal>

      {celebratingTask && (
        <UnlockAnimation task={celebratingTask} onDismiss={dismissCelebration} />
      )}
    </PageContainer>
  );
}
