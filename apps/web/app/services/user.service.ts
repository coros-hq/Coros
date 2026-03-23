import { api } from '~/lib/api';

export interface ApiUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  organizationId: string;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export async function getUserMe(): Promise<ApiUser> {
  return api.get<ApiUser>('/users/me');
}

export async function updateUserMe(
  dto: Partial<UpdateProfileDto> | Partial<UpdatePasswordDto>
): Promise<ApiUser> {
  return api.patch<ApiUser>('/users/me', dto);
}
