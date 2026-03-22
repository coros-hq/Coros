import { api, refreshSession } from '~/lib/api';
import { authUserFromAccessToken } from '~/lib/auth-from-token';
import type { AuthUser } from '~/stores/auth.store';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  organizationName: string;
  industryId: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

type ApiTokenResponse = { accessToken: string };

async function postAuth(
  path: string,
  body: unknown,
  hints?: { organizationName?: string },
): Promise<AuthResponse> {
  const { accessToken } = await api.post<ApiTokenResponse>(path, body);
  return {
    accessToken,
    user: authUserFromAccessToken(accessToken, hints),
  };
}

export const authService = {
  login: (dto: LoginDto) => postAuth('/auth/login', dto),

  register: (dto: RegisterDto) =>
    postAuth(
      '/auth/register',
      {
        organizationName: dto.organizationName,
        email: dto.email,
        password: dto.password,
        /** Matches `OrganizationSize.XS` in `@org/shared-types` (API validates with same enum). */
        size: '1-10',
        industryId: dto.industryId,
      },
      { organizationName: dto.organizationName },
    ),

  logout: () => api.post<void>('/auth/logout', {}),

  me: () => api.get<AuthUser>('/auth/me'),

  refresh: async () => {
    const { accessToken } = await refreshSession();
    return {
      accessToken,
      user: authUserFromAccessToken(accessToken),
    };
  },
};
