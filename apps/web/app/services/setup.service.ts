import { api } from '~/lib/api';

export interface SetupAccountPayload {
  firstName: string;
  lastName: string;
  departmentName: string;
  departmentColor?: string;
  positionTitle: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export const setupService = {
  getSetupStatus: () => api.get<{ setupRequired: boolean }>('/me/setup-status'),
  setup: (payload: SetupAccountPayload) => api.post<unknown>('/me/setup', payload),
};
