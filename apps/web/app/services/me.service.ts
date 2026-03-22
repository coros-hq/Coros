import { api } from '~/lib/api';

export interface ApiMeEmployee {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userId?: string;
  organizationId?: string;
  department?: { id: string; name: string };
  position?: { id: string; name: string };
  user?: { id: string; email: string };
}

export async function getMyEmployee(): Promise<ApiMeEmployee> {
  return api.get<ApiMeEmployee>('/me/employee');
}
