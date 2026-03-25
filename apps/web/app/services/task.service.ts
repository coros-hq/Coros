import { api } from '~/lib/api';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ApiTask {
  id: string;
  name: string;
  /** Per-project sequence for display slugs (with project key). */
  number?: number;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  organizationId: string;
  createdAt?: string;
  /** Present when API returns full task entity (e.g. completion time for reports). */
  updatedAt?: string;
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
    key?: string | null;
  };
}

export interface ApiTaskComment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
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

function normalizeComment(raw: {
  id: string;
  content: string;
  taskId: string;
  projectId?: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; email: string };
}): ApiTaskComment {
  return {
    id: raw.id,
    content: raw.content,
    taskId: raw.taskId,
    authorId: raw.author.id,
    author: {
      email: raw.author.email,
      firstName: raw.author.firstName,
      lastName: raw.author.lastName,
    },
    createdAt: raw.createdAt,
  };
}

export async function getComments(
  projectId: string,
  taskId: string
): Promise<ApiTaskComment[]> {
  const rows = await api.get<
    {
      id: string;
      content: string;
      taskId: string;
      projectId: string;
      createdAt: string;
      author: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    }[]
  >(`/projects/${projectId}/tasks/${taskId}/comments`);
  return rows.map(normalizeComment);
}

export async function createComment(
  projectId: string,
  taskId: string,
  content: string
): Promise<ApiTaskComment> {
  const raw = await api.post<{
    id: string;
    content: string;
    taskId: string;
    projectId: string;
    createdAt: string;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>(`/projects/${projectId}/tasks/${taskId}/comments`, { content });
  return normalizeComment(raw);
}

export async function deleteComment(
  projectId: string,
  taskId: string,
  commentId: string
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(
    `/projects/${projectId}/tasks/${taskId}/comments/${commentId}`
  );
}

/** @deprecated Use `remove` */
export async function deleteTask(
  projectId: string,
  taskId: string
): Promise<{ message: string }> {
  return remove(projectId, taskId);
}
