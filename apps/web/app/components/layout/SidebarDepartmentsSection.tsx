import { Link, useLocation } from 'react-router';
import { Building2 } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '~/components/ui/sidebar';
import { useAuthStore } from '~/stores/auth.store';
import { isManagementRole } from '~/lib/nav-roles';

export function SidebarDepartmentsSection() {
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);

  if (!isManagementRole(role)) {
    return null;
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Departments</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="w-60"
            isActive={location.pathname.startsWith('/departments')}
            asChild
            tooltip="Departments"
          >
            <Link to="/departments">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Departments</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
