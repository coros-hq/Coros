import { api } from '~/lib/api';

/** Matches API `Employee` with relations from GET /employees. */
export interface ApiEmployee {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  status?: string;
  hireDate?: string;
  dateOfBirth?: string;
  employmentType?: string;
  address?: string;
  user?: { id: string; email: string; role?: string };
  department?: { id: string; name: string };
  position?: { id: string; name: string };
  managerId?: string;
  manager?: { id: string; firstName: string; lastName: string };
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  avatar?: string;
  dateOfBirth?: string;
  hireDate?: string;
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
  role?: string;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  positionId?: string;
  managerId?: string;
  avatar?: string;
  dateOfBirth?: string;
  hireDate?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'intern';
  role?: string;
}

export async function listEmployees(): Promise<ApiEmployee[]> {
  return api.get<ApiEmployee[]>('/employees');
}

/** Alias for reports and bulk loaders. */
export async function getAll(): Promise<ApiEmployee[]> {
  return listEmployees();
}

export async function getEmployee(id: string): Promise<ApiEmployee> {
  return api.get<ApiEmployee>(`/employees/${id}`);
}

export async function createEmployee(
  payload: CreateEmployeePayload
): Promise<{ employee: ApiEmployee }> {
  return api.post<{ employee: ApiEmployee }>('/employees/create', payload);
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<ApiEmployee> {
  return api.patch<ApiEmployee>(`/employees/${id}`, payload);
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/employees/${id}`);
}
