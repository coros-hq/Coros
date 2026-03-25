import type { ApiEmployee } from '~/services/employee.service';

export interface OrgChartNode {
  id: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  department?: string | null;
  departmentColor?: string | null;
  managerId?: string | null;
  children: OrgChartNode[];
}

export function buildOrgTree(employees: ApiEmployee[]): OrgChartNode[] {
  const map = new Map<string, OrgChartNode>();
  const roots: OrgChartNode[] = [];

  // Build map
  for (const emp of employees) {
    const dept = emp.department as { id: string; name: string; color?: string } | undefined;
    map.set(emp.id, {
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      position: emp.position?.name ?? null,
      department: emp.department?.name ?? null,
      departmentColor: dept?.color ?? null,
      managerId: emp.managerId ?? null,
      children: [],
    });
  }

  // Build tree
  for (const emp of employees) {
    const node = map.get(emp.id)!;
    if (emp.managerId && map.has(emp.managerId)) {
      map.get(emp.managerId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
