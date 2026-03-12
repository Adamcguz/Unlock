import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectTask } from '../types';
import { STORAGE_KEYS } from '../lib/constants';
import { generateId } from '../lib/storage';

interface ProjectState {
  projects: Project[];
  createProject: (data: { name: string; description: string }) => Project;
  updateProject: (id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'status'>>) => void;
  deleteProject: (id: string) => void;
  addProjectTask: (projectId: string, data: {
    name: string;
    difficulty: number;
    assignedDate: string;
    notes: string;
  }) => ProjectTask | null;
  updateProjectTask: (projectId: string, taskId: string, updates: Partial<Pick<ProjectTask, 'name' | 'difficulty' | 'assignedDate' | 'notes'>>) => void;
  removeProjectTask: (projectId: string, taskId: string) => void;
  markTaskSpawned: (projectId: string, projectTaskId: string, taskId: string) => void;
  markTaskCompleted: (projectId: string, projectTaskId: string) => void;
  completeProject: (id: string) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],

      createProject: (data) => {
        const project: Project = {
          id: generateId(),
          name: data.name,
          description: data.description,
          tasks: [],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      },

      addProjectTask: (projectId, data) => {
        const projectTask: ProjectTask = {
          id: generateId(),
          projectId,
          name: data.name,
          difficulty: data.difficulty,
          assignedDate: data.assignedDate,
          notes: data.notes,
          taskId: null,
          status: 'pending',
        };
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: [...p.tasks, projectTask] }
              : p
          ),
        }));
        return projectTask;
      },

      updateProjectTask: (projectId, taskId, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...updates } : t
                  ),
                }
              : p
          ),
        }));
      },

      removeProjectTask: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
              : p
          ),
        }));
      },

      markTaskSpawned: (projectId, projectTaskId, taskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === projectTaskId
                      ? { ...t, taskId, status: 'spawned' as const }
                      : t
                  ),
                }
              : p
          ),
        }));
      },

      markTaskCompleted: (projectId, projectTaskId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === projectTaskId
                      ? { ...t, status: 'completed' as const }
                      : t
                  ),
                }
              : p
          ),
        }));
      },

      completeProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, status: 'completed' as const } : p
          ),
        }));
      },

      reset: () => set({ projects: [] }),
    }),
    {
      name: STORAGE_KEYS.PROJECTS,
      version: 1,
    }
  )
);
