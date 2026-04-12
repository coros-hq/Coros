import { api, http } from '~/lib/api';

export type OrganizationSize = '1-10' | '11-50' | '51-200' | '201-500' | '500+';

export interface OrganizationBrandingDto {
  logoUrl?: string;
  brandColor?: string;
}

export interface ApiOrganization {
  id: string;
  name: string;
  slug: string;
  website?: string;
  size?: OrganizationSize;
  industryId?: string | null;
  industry?: { id: string; name: string } | null;
  isActive: boolean;
  isOnboarded?: boolean;
  logoUrl?: string | null;
  brandColor?: string | null;
  createdAt: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  website?: string;
  industry?: string;
  industryId?: string;
  size?: OrganizationSize;
  isActive?: boolean;
  isOnboarded?: boolean;
}

export async function getOrganizationMe(): Promise<ApiOrganization> {
  return api.get<ApiOrganization>('/organizations/me');
}

export async function updateOrganizationMe(
  dto: UpdateOrganizationDto
): Promise<ApiOrganization> {
  return api.patch<ApiOrganization>('/organizations/me', dto);
}

export const updateMe = updateOrganizationMe;

export async function getOrganizationBranding(
  organizationId: string
): Promise<OrganizationBrandingDto> {
  /** Use authenticated client so the request runs after session is established (same unwrap + cookies as the rest of the app). */
  return api.get<OrganizationBrandingDto>(
    `/organizations/${organizationId}/branding`
  );
}

export async function patchOrganizationBranding(
  organizationId: string,
  formData: FormData
): Promise<OrganizationBrandingDto> {
  const res = await http.patch<OrganizationBrandingDto>(
    `/organizations/${organizationId}/branding`,
    formData
  );
  return res.data;
}
