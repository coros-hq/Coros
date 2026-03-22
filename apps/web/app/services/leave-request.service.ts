import { api } from '~/lib/api';

export interface ApiLeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string | null;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: { email: string };
  };
}

export interface CreateLeaveRequestDto {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
  employeeId: string;
}

export async function getAllLeaveRequests(): Promise<ApiLeaveRequest[]> {
  return api.get<ApiLeaveRequest[]>('/leave-request');
}

export async function createLeaveRequest(
  dto: CreateLeaveRequestDto
): Promise<ApiLeaveRequest> {
  return api.post<ApiLeaveRequest>('/leave-request/create', dto);
}

export async function approveLeaveRequest(id: string): Promise<ApiLeaveRequest> {
  return api.patch<ApiLeaveRequest>(`/leave-request/approve/${id}`);
}

export async function rejectLeaveRequest(id: string): Promise<ApiLeaveRequest> {
  return api.patch<ApiLeaveRequest>(`/leave-request/reject/${id}`);
}

export async function cancelLeaveRequest(id: string): Promise<ApiLeaveRequest> {
  return api.patch<ApiLeaveRequest>(`/leave-request/cancel/${id}`);
}

export interface UpdateLeaveRequestDto {
  type?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export async function updateLeaveRequest(
  id: string,
  dto: UpdateLeaveRequestDto
): Promise<ApiLeaveRequest> {
  return api.put<ApiLeaveRequest>(`/leave-request/update/${id}`, dto);
}
