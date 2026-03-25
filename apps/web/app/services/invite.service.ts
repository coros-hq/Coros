import { api } from '~/lib/api';

export const inviteService = {
  setPassword: async (token: string, password: string): Promise<void> => {
    await api.post(`/invite/set-password/${token}`, { password });
  },
};
