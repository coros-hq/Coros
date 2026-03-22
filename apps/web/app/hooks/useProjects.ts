import { useCallback, useEffect, useState } from 'react';
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
      await createProject(dto);
      await refetch();
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, dto: UpdateProjectDto) => {
      await updateProject(id, dto);
      await refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteProject(id);
      await refetch();
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
