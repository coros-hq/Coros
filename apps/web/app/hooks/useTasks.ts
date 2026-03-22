import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiTask, CreateTaskDto, UpdateTaskDto } from '~/services/task.service';
import {
  getAll,
  create,
  update,
  remove,
} from '~/services/task.service';

export function useTasks(projectId: string | undefined) {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFirstFetch = useRef(true);

  const refetch = useCallback(async () => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }
    const showSpinner = isFirstFetch.current;
    if (showSpinner) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await getAll(projectId);
      setTasks(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load tasks';
      setError(msg);
      setTasks([]);
    } finally {
      if (isFirstFetch.current) {
        isFirstFetch.current = false;
      }
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    isFirstFetch.current = true;
  }, [projectId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTask = useCallback(
    async (dto: CreateTaskDto): Promise<ApiTask> => {
      if (!projectId) throw new Error('No project id');
      const task = await create(projectId, dto);
      await refetch();
      return task;
    },
    [projectId, refetch]
  );

  const updateTask = useCallback(
    async (taskId: string, dto: UpdateTaskDto) => {
      if (!projectId) return;
      await update(projectId, taskId, dto);
      await refetch();
    },
    [projectId, refetch]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!projectId) return;
      await remove(projectId, taskId);
      await refetch();
    },
    [projectId, refetch]
  );

  return {
    tasks,
    isLoading,
    error,
    refetch,
    create: createTask,
    update: updateTask,
    remove: removeTask,
  };
}
