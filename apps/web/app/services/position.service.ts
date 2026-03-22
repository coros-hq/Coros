import { api } from '~/lib/api';

export interface ApiPosition {
  id: string;
  name: string;
  department?: { id: string; name: string };
}

export async function listPositions(): Promise<ApiPosition[]> {
  return api.get<ApiPosition[]>('/positions/all');
}

export async function createPosition(
  departmentId: string,
  name: string,
  description?: string
): Promise<ApiPosition> {
  return api.post<ApiPosition>(`/positions/create/${departmentId}`, {
    name,
    description,
  });
}
