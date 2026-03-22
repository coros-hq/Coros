import { useCallback, useEffect, useState } from 'react';
import type {
  ApiProject,
  ApiProjectMember,
  UpdateProjectDto,
  AddMemberDto,
} from '~/services/project.service';
import {
  getProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '~/services/project.service';

export function useProjectDetail(id: string | undefined) {
  const [project, setProject] = useState<ApiProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProject(id);
      setProject(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load project';
      setError(msg);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(
    async (dto: UpdateProjectDto) => {
      if (!id) return;
      await updateProject(id, dto);
      await refetch();
    },
    [id, refetch]
  );

  const remove = useCallback(async () => {
    if (!id) return;
    await deleteProject(id);
  }, [id]);

  const addMember = useCallback(
    async (dto: AddMemberDto): Promise<ApiProjectMember> => {
      if (!id) throw new Error('No project id');
      const member = await addProjectMember(id, dto);
      await refetch();
      return member;
    },
    [id, refetch]
  );

  const removeMemberAction = useCallback(
    async (employeeId: string) => {
      if (!id) return;
      await removeProjectMember(id, employeeId);
      await refetch();
    },
    [id, refetch]
  );

  return {
    project,
    isLoading,
    error,
    refetch,
    update,
    remove,
    addMember,
    removeMember: removeMemberAction,
  };
}
