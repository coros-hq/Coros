import { useCallback, useEffect, useState } from 'react';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiLeaveBalance } from '~/services/leave-balance.service';
import type { ApiTask } from '~/services/task.service';
import {
  getEmployee,
  updateEmployee,
  type UpdateEmployeePayload,
} from '~/services/employee.service';
import { getLeaveBalancesByEmployee } from '~/services/leave-balance.service';
import { getTasksByEmployee } from '~/services/task.service';

export function useEmployeeDetail(id: string | undefined) {
  const [employee, setEmployee] = useState<ApiEmployee | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<ApiLeaveBalance[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setEmployee(null);
      setLeaveBalances([]);
      setTasks([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [emp, balances, tasksRes] = await Promise.all([
        getEmployee(id),
        getLeaveBalancesByEmployee(id).catch(() => []),
        getTasksByEmployee(id).catch(() => []),
      ]);
      setEmployee(emp);
      setLeaveBalances(balances);
      setTasks(tasksRes);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load employee';
      setError(msg);
      setEmployee(null);
      setLeaveBalances([]);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const update = useCallback(
    async (payload: UpdateEmployeePayload) => {
      if (!id) return;
      await updateEmployee(id, payload);
      await refetch();
    },
    [id, refetch]
  );

  return {
    employee,
    leaveBalances,
    tasks,
    isLoading,
    error,
    refetch,
    update,
  };
}
