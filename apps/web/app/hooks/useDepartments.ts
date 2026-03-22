import { useCallback, useEffect, useState } from 'react';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiEmployee } from '~/services/employee.service';
import {
  getAll,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
} from '~/services/department.service';
import { listEmployees } from '~/services/employee.service';

export function useDepartments() {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deps, emps] = await Promise.all([
        getAll(),
        listEmployees(),
      ]);
      setDepartments(deps);
      setEmployees(emps);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to load';
      setError(msg);
      setDepartments([]);
      setEmployees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (dto: CreateDepartmentDto) => {
      await createDepartment(dto.name, dto.color);
      await refetch();
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, dto: UpdateDepartmentDto) => {
      await updateDepartment(id, dto);
      await refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDepartment(id);
      await refetch();
    },
    [refetch]
  );

  const departmentsWithCounts = departments.map((dept) => ({
    ...dept,
    employeeCount:
      dept.employeeCount ??
      employees.filter((e) => e.department?.id === dept.id).length,
  }));

  return {
    departments: departmentsWithCounts,
    employees,
    isLoading,
    error,
    create,
    update,
    remove,
  };
}
