import { api } from '~/lib/api';

export interface Industry {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const industryService = {
  list: () => api.get<Industry[]>('/industry'),
};
