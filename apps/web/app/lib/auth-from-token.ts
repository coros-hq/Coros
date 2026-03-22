import type { AuthUser } from '~/stores/auth.store';

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapJwtRole(role: string): AuthUser['role'] {
  if (role === 'super_admin') return 'super_admin';
  if (role === 'admin') return 'admin';
  if (role === 'manager') return 'manager';
  return 'employee';
}

export function authUserFromAccessToken(
  accessToken: string,
  hints?: { organizationName?: string },
): AuthUser {
  const p = parseJwtPayload(accessToken) ?? {};
  const email = String(p.email ?? '');
  const local = email.split('@')[0] || 'user';
  const tokens = local.split(/[._-]+/).filter(Boolean);
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s);
  const firstName = tokens[0] ? cap(tokens[0]) : 'User';
  const lastName = tokens
    .slice(1)
    .map((t) => cap(t))
    .join(' ');

  return {
    id: String(p.sub ?? ''),
    email,
    firstName,
    lastName,
    role: mapJwtRole(String(p.role ?? '')),
    organizationId: String(p.organizationId ?? ''),
    organizationName: hints?.organizationName ?? '',
  };
}
