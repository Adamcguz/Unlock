export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface ProjectTask {
  id: string;
  projectId: string;
  name: string;
  difficulty: number;
  assignedDate: string; // YYYY-MM-DD
  notes: string;
  taskId: string | null; // Links to spawned Task in useTaskStore
  status: 'pending' | 'spawned' | 'completed';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: ProjectTask[];
  status: ProjectStatus;
  createdAt: string;
}
