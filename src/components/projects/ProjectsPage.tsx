import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { PageContainer } from '../layout/PageContainer';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ProjectCard } from './ProjectCard';
import { ProjectDetail } from './ProjectDetail';
import { CreateProjectForm } from './CreateProjectForm';
import { useProjectStore } from '../../store/useProjectStore';

export function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'completed' || p.status === 'archived');

  if (selectedProject) {
    return (
      <PageContainer className="flex flex-col gap-4">
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProjectId(null)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Projects</h1>
        <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          New
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={40} />}
          title="No projects yet"
          description="Create a project to break larger goals into smaller tasks with assigned dates."
          action={
            <Button size="sm" icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
              Create Project
            </Button>
          }
        />
      ) : (
        <>
          {activeProjects.length > 0 && (
            <div className="flex flex-col gap-2">
              {activeProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onSelect={() => setSelectedProjectId(p.id)}
                />
              ))}
            </div>
          )}

          {completedProjects.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-text-muted mt-2">Completed / Archived</h2>
              {completedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onSelect={() => setSelectedProjectId(p.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Project"
      >
        <CreateProjectForm
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedProjectId(id);
          }}
        />
      </Modal>
    </PageContainer>
  );
}
