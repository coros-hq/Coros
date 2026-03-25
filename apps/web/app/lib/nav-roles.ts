/** Sidebar / API: list employees, org chart, departments — manager and above only. */
export const ROLES_MANAGEMENT = ['super_admin', 'admin', 'manager'] as const;

export type ManagementRole = (typeof ROLES_MANAGEMENT)[number];

export function isManagementRole(role: string | undefined): boolean {
  return (
    role != null &&
    (ROLES_MANAGEMENT as readonly string[]).includes(role)
  );
}
