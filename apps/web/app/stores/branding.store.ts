import { useMemo } from 'react';
import { create } from 'zustand';

import { applyBrandTheme, resetBrandTheme } from '~/lib/brand-theme';
import type { OrganizationBrandingDto } from '~/services/organization.service';

import { useAuthStore } from './auth.store';

type BrandingSlice = OrganizationBrandingDto;

interface BrandingStore extends BrandingSlice {
  hydrate: (dto: OrganizationBrandingDto) => void;
  setBranding: (next: OrganizationBrandingDto) => void;
  reset: () => void;
}

export const useBrandingStore = create<BrandingStore>((set) => ({
  logoUrl: undefined,
  brandColor: undefined,
  hydrate: (dto) => {
    const next: BrandingSlice = {
      logoUrl: dto.logoUrl,
      brandColor: dto.brandColor,
    };
    set(next);
    applyBrandTheme(next.brandColor);
  },
  setBranding: (next) => {
    set({
      logoUrl: next.logoUrl,
      brandColor: next.brandColor,
    });
    applyBrandTheme(next.brandColor);
  },
  reset: () => {
    set({ logoUrl: undefined, brandColor: undefined });
    resetBrandTheme();
  },
}));

/** Clear org branding when the session ends (logout / missing org). */
useAuthStore.subscribe((state) => {
  const hasSession =
    Boolean(state.accessToken) &&
    Boolean(state.user?.organizationId && state.user.organizationId.length > 0);
  if (!hasSession) {
    useBrandingStore.getState().reset();
  }
});

export interface BrandingState {
  logoUrl?: string;
  brandColor?: string;
}

/** Stable shape for components that previously used `useBranding()` from context. */
export function useBranding(): {
  branding: BrandingState;
  setBranding: (next: OrganizationBrandingDto) => void;
} {
  const logoUrl = useBrandingStore((s) => s.logoUrl);
  const brandColor = useBrandingStore((s) => s.brandColor);
  const setBranding = useBrandingStore((s) => s.setBranding);

  const branding = useMemo(
    () => ({ logoUrl, brandColor }),
    [logoUrl, brandColor],
  );

  return { branding, setBranding };
}
