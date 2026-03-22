import { useCallback, useEffect, useState } from 'react';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiPosition } from '~/services/position.service';
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
} from '~/services/employee.service';
import {
  listDepartments,
  createDepartment,
} from '~/services/department.service';
import {
  listPositions,
  createPosition,
} from '~/services/position.service';

export function useEmployees() {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [positions, setPositions] = useState<ApiPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [emps, deps, pos] = await Promise.all([
        listEmployees(),
        listDepartments(),
        listPositions(),
      ]);
      setEmployees(emps);
      setDepartments(deps);
      setPositions(pos);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load';
      setError(msg);
      setEmployees([]);
      setDepartments([]);
      setPositions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (payload: CreateEmployeePayload) => {
      await createEmployee(payload);
      await refetch();
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, payload: UpdateEmployeePayload) => {
      await updateEmployee(id, payload);
      await refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteEmployee(id);
      await refetch();
    },
    [refetch]
  );

  const createDept = useCallback(
    async (name: string, color?: string) => {
      const dept = await createDepartment(name, color);
      await refetch();
      return dept;
    },
    [refetch]
  );

  const createPos = useCallback(
    async (departmentId: string, name: string, description?: string) => {
      const pos = await createPosition(departmentId, name, description);
      await refetch();
      return pos;
    },
    [refetch]
  );

  return {
    employees,
    departments,
    positions,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
    createDepartment: createDept,
    createPosition: createPos,
  };
}
