import { api } from '~/lib/api';

export interface ApiLeaveBalance {
  id: string;
  type: string;
  year: string;
  used: number;
  remaining: number;
  total: number;
}

export async function getMyLeaveBalances(): Promise<ApiLeaveBalance[]> {
  return api.get<ApiLeaveBalance[]>('/leave-balance/me');
}

export async function getLeaveBalancesByEmployee(
  employeeId: string
): Promise<ApiLeaveBalance[]> {
  return api.get<ApiLeaveBalance[]>(`/leave-balance/employee/${employeeId}`);
}
