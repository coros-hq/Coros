import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type {
  ApiProject,
  CreateProjectDto,
  UpdateProjectDto,
} from '~/services/project.service';
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from '~/services/project.service';

function extractMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return fallback;
}

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load projects';
      setError(msg);
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (dto: CreateProjectDto) => {
      try {
        await createProject(dto);
        await refetch();
        toast.success('Project created');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to create project'));
        throw e;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, dto: UpdateProjectDto) => {
      try {
        await updateProject(id, dto);
        await refetch();
        toast.success('Project updated');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to update project'));
        throw e;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteProject(id);
        await refetch();
        toast.success('Project deleted');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to delete project'));
        throw e;
      }
    },
    [refetch]
  );

  return {
    projects,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
  };
}
