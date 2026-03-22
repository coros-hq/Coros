import { useCallback, useEffect, useState } from 'react';
import type {
  ApiDepartment,
  UpdateDepartmentDto,
} from '~/services/department.service';
import type {
  ApiEmployee,
  CreateEmployeePayload,
  UpdateEmployeePayload,
} from '~/services/employee.service';
import type { ApiPosition } from '~/services/position.service';
import {
  getAll,
  getDepartment,
  updateDepartment,
  deleteDepartment,
} from '~/services/department.service';
import {
  createEmployee,
  updateEmployee as updateEmployeeApi,
} from '~/services/employee.service';
import { createPosition as createPositionApi } from '~/services/position.service';
import { listEmployees } from '~/services/employee.service';
import { listPositions } from '~/services/position.service';

export function useDepartmentDetail(id: string | undefined) {
  const [department, setDepartment] = useState<ApiDepartment | null>(null);
  const [allDepartments, setAllDepartments] = useState<ApiDepartment[]>([]);
  const [allEmployees, setAllEmployees] = useState<ApiEmployee[]>([]);
  const [allPositions, setAllPositions] = useState<ApiPosition[]>([]);
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
      const [dept, deps, emps, pos] = await Promise.all([
        getDepartment(id),
        getAll(),
        listEmployees(),
        listPositions(),
      ]);
      setDepartment(dept);
      setAllDepartments(deps);
      setAllEmployees(emps);
      setAllPositions(pos);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load';
      setError(msg);
      setDepartment(null);
      setAllDepartments([]);
      setAllEmployees([]);
      setAllPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const employees = allEmployees.filter((e) => e.department?.id === id);
  const positions = allPositions.filter((p) => p.department?.id === id);

  const update = useCallback(
    async (dto: UpdateDepartmentDto) => {
      if (!id) return;
      await updateDepartment(id, dto);
      await refetch();
    },
    [id, refetch]
  );

  const remove = useCallback(
    async () => {
      if (!id) return;
      await deleteDepartment(id);
    },
    [id]
  );

  const createEmployeeInDept = useCallback(
    async (payload: CreateEmployeePayload) => {
      await createEmployee(payload);
      await refetch();
    },
    [refetch]
  );

  const updateEmployee = useCallback(
    async (employeeId: string, payload: UpdateEmployeePayload) => {
      await updateEmployeeApi(employeeId, payload);
      await refetch();
    },
    [refetch]
  );

  const createPosition = useCallback(
    async (departmentId: string, name: string, description?: string) => {
      const pos = await createPositionApi(departmentId, name, description);
      await refetch();
      return pos;
    },
    [refetch]
  );

  return {
    department,
    employees,
    positions,
    isLoading,
    error,
    refetch,
    update,
    remove,
    allEmployees,
    allDepartments,
    allPositions: allPositions,
    createEmployee: createEmployeeInDept,
    updateEmployee,
    createPosition,
  };
}
