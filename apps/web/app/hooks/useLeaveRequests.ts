import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ApiLeaveRequest } from '~/services/leave-request.service';
import type { ApiLeaveBalance } from '~/services/leave-balance.service';
import type { ApiMeEmployee } from '~/services/me.service';
import type { ApiEmployee } from '~/services/employee.service';
import {
  getAllLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  type CreateLeaveRequestDto,
  type UpdateLeaveRequestDto,
} from '~/services/leave-request.service';
import { getMyLeaveBalances } from '~/services/leave-balance.service';
import { getMyEmployee } from '~/services/me.service';
import { listEmployees } from '~/services/employee.service';

function extractMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return 'Failed to load';
}

export function useLeaveRequests() {
  const [requests, setRequests] = useState<ApiLeaveRequest[]>([]);
  const [balances, setBalances] = useState<ApiLeaveBalance[]>([]);
  const [employee, setEmployee] = useState<ApiMeEmployee | null>(null);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [employeeRes, requestsRes, balancesRes, employeesRes] =
        await Promise.allSettled([
          getMyEmployee(),
          getAllLeaveRequests(),
          getMyLeaveBalances(),
          listEmployees(),
        ]);

      const emp =
        employeeRes.status === 'fulfilled' ? employeeRes.value : null;
      const reqs =
        requestsRes.status === 'fulfilled' ? requestsRes.value : [];
      const bals =
        balancesRes.status === 'fulfilled' ? balancesRes.value : [];
      const emps =
        employeesRes.status === 'fulfilled' ? employeesRes.value : [];

      setEmployee(employeeRes.status === 'rejected' ? null : emp);
      setRequests(requestsRes.status === 'rejected' ? [] : reqs);
      setBalances(balancesRes.status === 'rejected' ? [] : bals);
      setEmployees(employeesRes.status === 'rejected' ? [] : emps);

      if (requestsRes.status === 'rejected') {
        setError(extractMessage(requestsRes.reason));
      }
    } catch (e) {
      setError(extractMessage(e));
      setRequests([]);
      setBalances([]);
      setEmployee(null);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (dto: CreateLeaveRequestDto) => {
      try {
        await createLeaveRequest(dto);
        await refetch();
        toast.success('Leave request submitted');
      } catch (e) {
        toast.error(extractMessage(e));
        throw e;
      }
    },
    [refetch]
  );

  const approve = useCallback(
    async (id: string) => {
      try {
        await approveLeaveRequest(id);
        await refetch();
        toast.success('Leave request approved');
      } catch (e) {
        toast.error(extractMessage(e));
        throw e;
      }
    },
    [refetch]
  );

  const reject = useCallback(
    async (id: string) => {
      try {
        await rejectLeaveRequest(id);
        await refetch();
        toast.success('Leave request rejected');
      } catch (e) {
        toast.error(extractMessage(e));
        throw e;
      }
    },
    [refetch]
  );

  const cancel = useCallback(
    async (id: string) => {
      try {
        await cancelLeaveRequest(id);
        await refetch();
        toast.success('Leave request cancelled');
      } catch (e) {
        toast.error(extractMessage(e));
        throw e;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, dto: UpdateLeaveRequestDto) => {
      try {
        await updateLeaveRequest(id, dto);
        await refetch();
        toast.success('Leave request updated');
      } catch (e) {
        toast.error(extractMessage(e));
        throw e;
      }
    },
    [refetch]
  );

  return {
    requests,
    balances,
    employee,
    employees,
    isLoading,
    error,
    create,
    update,
    approve,
    reject,
    cancel,
    refetch,
  };
}
