import { useState } from 'react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle2, Clock, Circle, Zap } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AddProjectTaskForm } from './AddProjectTaskForm';
import { useProjectStore } from '../../store/useProjectStore';
import { getDifficultyLabel, getDifficultyColor } from '../../lib/constants';
import type { Project, ProjectTask } from '../../types';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const removeProjectTask = useProjectStore((s) => s.removeProjectTask);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const completeProject = useProjectStore((s) => s.completeProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  const total = project.tasks.length;
  const completed = project.tasks.filter((t) => t.status === 'completed').length;
  const allDone = total > 0 && completed === total;
  const isCompleted = project.status === 'completed';

  const sortedTasks = [...project.tasks].sort((a, b) =>
    a.assignedDate.localeCompare(b.assignedDate)
  );

  const today = startOfDay(new Date());

  const getStatusIcon = (task: ProjectTask) => {
    if (task.status === 'completed') return <CheckCircle2 size={18} className="text-green-400" />;
    if (task.status === 'spawned') return <Zap size={18} className="text-primary" />;
    const taskDate = startOfDay(parseISO(task.assignedDate));
    if (isBefore(taskDate, today)) return <Clock size={18} className="text-orange-400" />;
    return <Circle size={18} className="text-text-muted" />;
  };

  const getStatusLabel = (task: ProjectTask) => {
    if (task.status === 'completed') return 'Completed';
    if (task.status === 'spawned') return 'Active today';
    const taskDate = startOfDay(parseISO(task.assignedDate));
    if (isBefore(taskDate, today)) return 'Overdue';
    return 'Pending';
  };

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
          <div>
            <h2 className="text-xl font-bold text-text-primary">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-text-secondary mt-1">{project.description}</p>
            )}
          </div>
          {isCompleted && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
              Completed
            </span>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span>{completed}/{total} tasks complete</span>
            <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Tasks</h3>
        {!isCompleted && (
          <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setShowAddTask(true)}>
            Add Task
          </Button>
        )}
      </div>

      {sortedTasks.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">
          No tasks yet. Add tasks to break this project into steps.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-surface-light rounded-xl p-3 ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(task)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-text-primary ${
                      task.status === 'completed' ? 'line-through' : ''
                    }`}>
                      {task.name}
                    </span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getDifficultyColor(task.difficulty)}`}>
                      {getDifficultyLabel(task.difficulty)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    <span>{format(parseISO(task.assignedDate), 'MMM d, yyyy')}</span>
                    <span className="text-text-muted/50">|</span>
                    <span>{getStatusLabel(task)}</span>
                  </div>
                  {task.notes && (
                    <p className="text-xs text-text-secondary mt-1">{task.notes}</p>
                  )}
                </div>
                {task.status === 'pending' && !isCompleted && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => removeProjectTask(project.id, task.id)}
                      className="p-1.5 text-text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isCompleted && allDone && (
        <Button onClick={() => completeProject(project.id)}>
          Mark Project Complete
        </Button>
      )}

      {!isCompleted && !allDone && total > 0 && (
        <Button
          variant="ghost"
          onClick={() => {
            updateProject(project.id, { status: 'archived' });
            onBack();
          }}
        >
          Archive Project
        </Button>
      )}

      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center justify-center gap-2 text-sm text-danger hover:text-danger/80 transition-colors cursor-pointer py-2"
        >
          <Trash2 size={14} />
          Delete Project
        </button>
      ) : (
        <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-danger font-medium">Delete this project?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-text-muted hover:text-text-primary px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                deleteProject(project.id);
                onBack();
              }}
              className="text-xs text-white bg-danger px-3 py-1 rounded-lg hover:bg-danger/80 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Add Task"
      >
        <AddProjectTaskForm
          projectId={project.id}
          onDone={() => setShowAddTask(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Task"
      >
        {editingTask && (
          <AddProjectTaskForm
            projectId={project.id}
            editingTask={editingTask}
            onDone={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  );
}
