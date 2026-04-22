import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { authUserFromAccessToken } from '~/lib/auth-from-token';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "super_admin" | "admin" | "manager" | "employee";
  organizationId: string;
  organizationName: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

const AUTH_COOKIE = 'coros_auth';
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const entry of cookies) {
    const idx = entry.indexOf('=');
    const key = idx === -1 ? entry : entry.slice(0, idx);
    if (key === name) {
      const value = idx === -1 ? '' : entry.slice(idx + 1);
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

const cookieStorage = {
  getItem: (name: string): string | null => readCookie(name),
  setItem: (name: string, value: string): void => writeCookie(name, value),
  removeItem: (name: string): void => deleteCookie(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false }),
      setAccessToken: (token) =>
        set((state) => ({
          accessToken: token,
          user: state.user ?? authUserFromAccessToken(token),
          isAuthenticated: true,
        })),
      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: AUTH_COOKIE,
      storage: createJSONStorage(() => cookieStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.accessToken) {
          state.user = authUserFromAccessToken(state.accessToken);
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);
