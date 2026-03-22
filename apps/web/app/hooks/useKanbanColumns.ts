import { useCallback, useEffect, useState } from 'react';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import {
  createKanbanColumn,
  deleteKanbanColumn,
  listKanbanColumns,
  reorderKanbanColumns,
  updateKanbanColumn,
} from '~/services/kanban-column.service';

export function useKanbanColumns(projectId: string | undefined) {
  const [columns, setColumns] = useState<ApiKanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await listKanbanColumns(projectId);
      setColumns(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load columns';
      setError(msg);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (name: string): Promise<ApiKanbanColumn> => {
      if (!projectId) throw new Error('No project id');
      const col = await createKanbanColumn(projectId, name);
      await refetch();
      return col;
    },
    [projectId, refetch]
  );

  const update = useCallback(
    async (columnId: string, name: string): Promise<ApiKanbanColumn> => {
      if (!projectId) throw new Error('No project id');
      const col = await updateKanbanColumn(projectId, columnId, name);
      await refetch();
      return col;
    },
    [projectId, refetch]
  );

  const remove = useCallback(
    async (columnId: string) => {
      if (!projectId) return;
      await deleteKanbanColumn(projectId, columnId);
      await refetch();
    },
    [projectId, refetch]
  );

  const reorder = useCallback(
    async (orderedIds: string[]) => {
      if (!projectId) return;
      await reorderKanbanColumns(projectId, orderedIds);
      await refetch();
    },
    [projectId, refetch]
  );

  return {
    columns,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
    reorder,
  };
}
