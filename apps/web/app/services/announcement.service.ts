import { api } from '~/lib/api';

export interface ApiAnnouncement {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  priority: 'normal' | 'important' | 'urgent';
  authorId: string;
  author: { firstName: string; lastName: string };
  organizationId: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt?: string;
  readCount?: number;
  /** Present on `GET /announcements?view=feed` */
  readByMe?: boolean;
  /** Admin list / detail */
  targetUserIds?: string[];
  targetDepartmentIds?: string[];
  targetUsers?: { id: string; firstName: string; lastName: string }[];
  targetDepartments?: { id: string; name: string }[];
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  priority?: 'normal' | 'important' | 'urgent';
  expiresAt?: string;
  imageUrls?: string[];
  targetUserIds?: string[];
  targetDepartmentIds?: string[];
}

export const announcementService = {
  getActive: async (): Promise<ApiAnnouncement[]> => {
    return api.get<ApiAnnouncement[]>('/announcements');
  },

  getFeed: async (): Promise<ApiAnnouncement[]> => {
    return api.get<ApiAnnouncement[]>('/announcements?view=feed');
  },

  getAll: async (): Promise<ApiAnnouncement[]> => {
    return api.get<ApiAnnouncement[]>('/announcements/all');
  },

  create: async (dto: CreateAnnouncementDto): Promise<ApiAnnouncement> => {
    return api.post<ApiAnnouncement>('/announcements', dto);
  },

  update: async (
    id: string,
    dto: Partial<CreateAnnouncementDto>,
  ): Promise<ApiAnnouncement> => {
    return api.patch<ApiAnnouncement>(`/announcements/${id}`, dto);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    return api.post<{ success: boolean }>(`/announcements/${id}/read`);
  },
};
