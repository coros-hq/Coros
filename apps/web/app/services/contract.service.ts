import { api } from '~/lib/api';

export interface ApiContract {
  id: string;
  employeeId: string;
  organizationId?: string;
  type: string;
  startDate: string;
  endDate?: string | null;
  salary?: number | null;
  currency: string;
  notes?: string | null;
  documentId?: string | null;
  document?: { id: string; name: string; url: string } | null;
  employee?: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface CreateContractDto {
  employeeId: string;
  type: string;
  startDate: string;
  endDate?: string;
  salary?: number;
  currency?: string;
  notes?: string;
  documentId?: string;
}

export const contractService = {
  getAll: async (): Promise<ApiContract[]> => {
    return api.get<ApiContract[]>('/contracts');
  },

  getByEmployee: async (employeeId: string): Promise<ApiContract[]> => {
    return api.get<ApiContract[]>(`/contracts/employee/${employeeId}`);
  },

  create: async (dto: CreateContractDto): Promise<ApiContract> => {
    return api.post<ApiContract>('/contracts', dto);
  },

  update: async (
    id: string,
    dto: Partial<Omit<CreateContractDto, 'employeeId'>>
  ): Promise<ApiContract> => {
    return api.patch<ApiContract>(`/contracts/${id}`, dto);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  },
};
