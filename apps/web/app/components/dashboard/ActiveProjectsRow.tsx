// ActiveProjectsRow.tsx
// 3-4 most recent projects, click to go to project

import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { FolderKanban } from 'lucide-react';

import { ProjectCard } from '~/components/projects/ProjectCard';
import { useProjects } from '~/hooks/useProjects';
import { useAuthStore } from '~/stores/auth.store';

const MAX_PROJECTS = 4;

export function ActiveProjectsRow() {
  const navigate = useNavigate();
  const { projects, isLoading, error } = useProjects();
  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const ta = new Date(a.createdAt ?? a.startDate ?? 0).getTime();
        const tb = new Date(b.createdAt ?? b.startDate ?? 0).getTime();
        return tb - ta;
      })
      .slice(0, MAX_PROJECTS);
  }, [projects]);

  if (error) {
    return (
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderKanban className="size-4" />
          Active projects
        </h2>
        <p className="text-sm text-destructive">{error}</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderKanban className="size-4" />
          Active projects
        </h2>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      </section>
    );
  }

  if (recentProjects.length === 0) {
    return (
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderKanban className="size-4" />
          Active projects
        </h2>
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No projects yet
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <FolderKanban className="size-4" />
        Active projects
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recentProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            canMutate={false}
            onEdit={() => {}}
            onDelete={() => {}}
            onClick={() => navigate(`/projects/${project.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
