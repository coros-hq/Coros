import { api } from '~/lib/api';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ApiTask {
  id: string;
  name: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  organizationId: string;
  createdAt?: string;
  kanbanColumnId?: string | null;
  kanbanColumn?: {
    id: string;
    name: string;
    statusKey?: string | null;
  } | null;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: { id?: string; email?: string };
  } | null;
  project?: {
    id: string;
    name: string;
  };
}

export interface CreateTaskDto {
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assigneeId?: string;
  kanbanColumnId?: string;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  assigneeId?: string | null;
  kanbanColumnId?: string | null;
}

export async function getMyTasks(): Promise<ApiTask[]> {
  return api.get<ApiTask[]>('/me/tasks');
}

export async function getTasksByEmployee(
  employeeId: string
): Promise<ApiTask[]> {
  return api.get<ApiTask[]>(`/employees/${employeeId}/tasks`);
}

export async function getAll(projectId: string): Promise<ApiTask[]> {
  return api.get<ApiTask[]>(`/projects/${projectId}/tasks`);
}

/** @deprecated Use `getAll` */
export async function getProjectTasks(projectId: string): Promise<ApiTask[]> {
  return getAll(projectId);
}

export async function create(projectId: string, dto: CreateTaskDto): Promise<ApiTask> {
  return api.post<ApiTask>(`/projects/${projectId}/tasks`, dto);
}

/** @deprecated Use `create` */
export async function createTask(
  projectId: string,
  dto: CreateTaskDto
): Promise<ApiTask> {
  return create(projectId, dto);
}

export async function update(
  projectId: string,
  taskId: string,
  dto: UpdateTaskDto
): Promise<ApiTask> {
  return api.patch<ApiTask>(`/projects/${projectId}/tasks/${taskId}`, dto);
}

/** @deprecated Use `update` */
export async function updateTask(
  projectId: string,
  taskId: string,
  dto: UpdateTaskDto
): Promise<ApiTask> {
  return update(projectId, taskId, dto);
}

export async function remove(
  projectId: string,
  taskId: string
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(
    `/projects/${projectId}/tasks/${taskId}`
  );
}

/** @deprecated Use `remove` */
export async function deleteTask(
  projectId: string,
  taskId: string
): Promise<{ message: string }> {
  return remove(projectId, taskId);
}
