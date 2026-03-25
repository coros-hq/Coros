import { api } from '~/lib/api';

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export const notificationService = {
  getAll: async (): Promise<ApiNotification[]> => {
    return api.get<ApiNotification[]>('/notifications');
  },
  getUnreadCount: async (): Promise<number> => {
    const data = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
