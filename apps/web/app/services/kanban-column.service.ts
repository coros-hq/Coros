import { api } from '~/lib/api';

export interface ApiKanbanColumn {
  id: string;
  projectId: string;
  name: string;
  position: number;
  statusKey: string | null;
  createdAt?: string;
}

export async function listKanbanColumns(
  projectId: string
): Promise<ApiKanbanColumn[]> {
  return api.get<ApiKanbanColumn[]>(`/projects/${projectId}/kanban-columns`);
}

export async function createKanbanColumn(
  projectId: string,
  name: string
): Promise<ApiKanbanColumn> {
  return api.post<ApiKanbanColumn>(`/projects/${projectId}/kanban-columns`, {
    name,
  });
}

export async function updateKanbanColumn(
  projectId: string,
  columnId: string,
  name: string
): Promise<ApiKanbanColumn> {
  return api.patch<ApiKanbanColumn>(
    `/projects/${projectId}/kanban-columns/${columnId}`,
    { name }
  );
}

export async function reorderKanbanColumns(
  projectId: string,
  orderedIds: string[]
): Promise<ApiKanbanColumn[]> {
  return api.patch<ApiKanbanColumn[]>(
    `/projects/${projectId}/kanban-columns/reorder`,
    { orderedIds }
  );
}

export async function deleteKanbanColumn(
  projectId: string,
  columnId: string
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(
    `/projects/${projectId}/kanban-columns/${columnId}`
  );
}
