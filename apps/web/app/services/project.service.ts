import { api } from '~/lib/api';
import type { ApiTask } from './task.service';

export type { ApiTask } from './task.service';
export type { TaskStatus, TaskPriority } from './task.service';

export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ProjectMemberRole = 'owner' | 'member';

export interface ApiProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  role: ProjectMemberRole;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: { email?: string };
  };
}

export interface ApiProject {
  id: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  organizationId: string;
  members?: ApiProjectMember[];
  tasks?: ApiTask[];
  memberCount?: number;
  taskCount?: number;
  /** Tasks with status `done` */
  completedTaskCount?: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  memberIds?: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface AddMemberDto {
  employeeId: string;
  role?: ProjectMemberRole;
}

export async function getAllProjects(): Promise<ApiProject[]> {
  return api.get<ApiProject[]>('/projects');
}

export async function getProject(id: string): Promise<ApiProject> {
  return api.get<ApiProject>(`/projects/${id}`);
}

export async function createProject(dto: CreateProjectDto): Promise<ApiProject> {
  return api.post<ApiProject>('/projects', dto);
}

export async function updateProject(
  id: string,
  dto: UpdateProjectDto
): Promise<ApiProject> {
  return api.patch<ApiProject>(`/projects/${id}`, dto);
}

export async function deleteProject(id: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/projects/${id}`);
}

export async function addProjectMember(
  projectId: string,
  dto: AddMemberDto
): Promise<ApiProjectMember> {
  return api.post<ApiProjectMember>(`/projects/${projectId}/members`, dto);
}

export async function removeProjectMember(
  projectId: string,
  employeeId: string
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(
    `/projects/${projectId}/members/${employeeId}`
  );
}

