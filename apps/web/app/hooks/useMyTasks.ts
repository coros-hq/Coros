import { useCallback, useEffect, useState } from 'react';
import type { ApiTask } from '~/services/task.service';
import { getMyTasks } from '~/services/task.service';

export function useMyTasks() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyTasks();
      setTasks(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load your tasks';
      setError(msg);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tasks, isLoading, error, refetch };
}
