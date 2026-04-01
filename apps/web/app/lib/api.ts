import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { authUserFromAccessToken } from '~/lib/auth-from-token';
import { useAuthStore } from '~/stores/auth.store';

/**
 * Prefer explicit URL from env (`COROS_API_ORIGIN` or `VITE_COROS_API_ORIGIN`) so the client
 * calls the real API origin (e.g. `http://localhost:3000/v1/api`). Only `VITE_*` and `COROS_*`
 * are exposed from `.env` — `COROS_API_ORIGIN` alone was previously ignored by Vite.
 * Dev fallback `/api/v1` uses the Vite proxy when no env base is set.
 */
function resolveApiBase(): string {
  const vite = import.meta.env.VITE_COROS_API_ORIGIN?.trim();
  if (vite) return vite;
  const coros = import.meta.env.COROS_API_ORIGIN?.trim();
  if (coros) {
    try {
      const u = new URL(coros.startsWith('http') ? coros : `http://${coros}`);
      const path = u.pathname.replace(/\/$/, '');
      if (path.endsWith('/v1/api')) return `${u.origin}${path}`;
      return `${u.origin}/v1/api`;
    } catch {
      /* ignore */
    }
  }
  if (import.meta.env.DEV) return '/api/v1';
  return '';
}

export const API_BASE = resolveApiBase();

/** Nest `ResponseInterceptor` wraps payloads as `{ statusCode, message, data }`. */
type WrappedResponse<T> = { data: T; statusCode?: number; message?: string };

export function unwrapApiResponse<T>(json: unknown): T {
  if (
    json !== null &&
    typeof json === 'object' &&
    'data' in json &&
    (json as WrappedResponse<T>).data !== undefined
  ) {
    return (json as WrappedResponse<T>).data;
  }
  return json as T;
}

/** No auth interceptiors — used for refresh and auth layout loaders. */
const bareClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export async function refreshSession(): Promise<{ accessToken: string }> {
  const res = await bareClient.post<unknown>('/auth/refresh-token', {});
  return unwrapApiResponse<{ accessToken: string }>(res.data);
}

export async function tryRefreshSession(): Promise<{
  accessToken: string;
} | null> {
  try {
    return await refreshSession();
  } catch {
    return null;
  }
}

function normalizeAxiosError(error: AxiosError): unknown {
  const data = error.response?.data;
  if (data !== null && typeof data === 'object') return data;
  return { message: error.message || 'Request failed' };
}

let refreshPromise: Promise<string> | null = null;

function getRefreshedAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshSession()
      .then(({ accessToken }) => {
        useAuthStore.getState().setAccessToken(accessToken);
        return accessToken;
      })
      .catch((err) => {
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    response.data = unwrapApiResponse(response.data) as unknown;
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(normalizeAxiosError(error));
    }

    const url = String(originalRequest.url ?? '');
    if (url.includes('/auth/refresh-token')) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(normalizeAxiosError(error));
    }

    if (originalRequest._retry) {
      return Promise.reject(normalizeAxiosError(error));
    }
    originalRequest._retry = true;

    try {
      const accessToken = await getRefreshedAccessToken();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient.request(originalRequest);
    } catch {
      return Promise.reject(normalizeAxiosError(error));
    }
  }
);

export const api = {
  get: <T>(path: string) => apiClient.get<T>(path).then((r) => r.data as T),
  post: <T>(path: string, body?: unknown) =>
    apiClient.post<T>(path, body).then((r) => r.data as T),
  put: <T>(path: string, body?: unknown) =>
    apiClient.put<T>(path, body).then((r) => r.data as T),
  patch: <T>(path: string, body?: unknown) =>
    apiClient.patch<T>(path, body).then((r) => r.data as T),
  delete: <T>(path: string) =>
    apiClient.delete<T>(path).then((r) => r.data as T),
};

/** Same client as `api` helpers — use for one-offs (`http.get`, custom config, uploads). */
export const http = apiClient;

/** Hydrate store from refresh cookie (loaders). */
export function applySessionFromAccessToken(
  accessToken: string,
  hints?: { organizationName?: string }
): void {
  useAuthStore
    .getState()
    .setAuth(authUserFromAccessToken(accessToken, hints), accessToken);
}
