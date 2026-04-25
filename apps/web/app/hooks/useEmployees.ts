import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiPosition } from '~/services/position.service';
import {
  listEmployees,
  createEmployee,
  bulkCreateEmployees,
  updateEmployee,
  deleteEmployee,
  deactivateEmployee,
  activateEmployee,
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

function extractMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    return String((e as { message: unknown }).message);
  }
  return fallback;
}

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
      try {
        await createEmployee(payload);
        await refetch();
        toast.success('Employee created');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to create employee'));
        throw e;
      }
    },
    [refetch]
  );

  const bulkCreate = useCallback(
    async (payloads: CreateEmployeePayload[]) => {
      try {
        await bulkCreateEmployees(payloads);
        await refetch();
        toast.success('Employees imported');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to import employees'));
        throw e;
      }
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, payload: UpdateEmployeePayload) => {
      try {
        await updateEmployee(id, payload);
        await refetch();
        toast.success('Employee updated');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to update employee'));
        throw e;
      }
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteEmployee(id);
        await refetch();
        toast.success('Employee deleted');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to delete employee'));
        throw e;
      }
    },
    [refetch]
  );

  const deactivate = useCallback(
    async (id: string) => {
      try {
        await deactivateEmployee(id);
        await refetch();
        toast.success('Employee deactivated');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to deactivate employee'));
        throw e;
      }
    },
    [refetch]
  );

  const activate = useCallback(
    async (id: string) => {
      try {
        await activateEmployee(id);
        await refetch();
        toast.success('Employee activated');
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to activate employee'));
        throw e;
      }
    },
    [refetch]
  );

  const createDept = useCallback(
    async (name: string, color?: string) => {
      try {
        const dept = await createDepartment(name, color);
        await refetch();
        toast.success('Department created');
        return dept;
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to create department'));
        throw e;
      }
    },
    [refetch]
  );

  const createPos = useCallback(
    async (departmentId: string, name: string, description?: string) => {
      try {
        const pos = await createPosition(departmentId, name, description);
        await refetch();
        toast.success('Position created');
        return pos;
      } catch (e) {
        toast.error(extractMessage(e, 'Failed to create position'));
        throw e;
      }
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
    bulkCreate,
    update,
    remove,
    deactivate,
    activate,
    createDepartment: createDept,
    createPosition: createPos,
  };
}
