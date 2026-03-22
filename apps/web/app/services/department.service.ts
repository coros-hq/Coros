import { api } from '~/lib/api';

export interface ApiDepartment {
  id: string;
  name: string;
  color?: string;
  manager?: { id: string; firstName: string; lastName: string };
  employeeCount?: number;
}

export interface CreateDepartmentDto {
  name: string;
  color?: string;
  managerId?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  color?: string;
  managerId?: string;
}

export async function getAll(): Promise<ApiDepartment[]> {
  return api.get<ApiDepartment[]>('/departments/all');
}

export async function getDepartment(id: string): Promise<ApiDepartment> {
  return api.get<ApiDepartment>(`/departments/${id}`);
}

/** @deprecated Use getAll. Kept for useEmployees compatibility. */
export async function listDepartments(): Promise<ApiDepartment[]> {
  return getAll();
}

export async function createDepartment(
  name: string,
  color?: string
): Promise<ApiDepartment> {
  return api.post<ApiDepartment>('/departments/add', { name, color });
}

export async function updateDepartment(
  id: string,
  dto: UpdateDepartmentDto
): Promise<{ message: string }> {
  const body: { name?: string; color?: string } = {};
  if (dto.name !== undefined) body.name = dto.name;
  if (dto.color !== undefined) body.color = dto.color;
  return api.patch<{ message: string }>(
    `/departments/update/${id}`,
    body
  );
}

export async function deleteDepartment(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/departments/delete/${id}`);
}
