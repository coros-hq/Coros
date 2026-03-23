import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Building2 } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import { DEPARTMENT_COLORS } from '~/constants/department-colors';
import { getAll, type ApiDepartment } from '~/services/department.service';

export function SidebarDepartmentsSection() {
  const location = useLocation();
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);

  useEffect(() => {
    getAll()
      .then(setDepartments)
      .catch(() => setDepartments([]));
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Departments</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={location.pathname === '/departments'}
            asChild
            tooltip="All departments"
          >
            <Link to="/departments">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>All departments</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        {departments.map((dept) => {
          const href = `/departments/${dept.id}`;
          const isActive = location.pathname === href;
          const color = dept.color ?? DEPARTMENT_COLORS[0].value;
          return (
            <SidebarMenuItem key={dept.id}>
              <SidebarMenuButton
                isActive={isActive}
                asChild
                tooltip={dept.name}
              >
                <Link to={href}>
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="truncate">{dept.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
