import { Link, Outlet, redirect, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
  Target,
  GitBranch,
  BarChart2,
  Megaphone,
  Star,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '~/components/ui/sidebar';
import { GlobalSearch } from '~/components/search/GlobalSearch';
import { NotificationBell } from '~/components/notifications/NotificationBell';
import { SidebarDepartmentsSection } from '~/components/layout/SidebarDepartmentsSection';
import { authService } from '~/services/auth.service';
import { setupService } from '~/services/setup.service';
import { useAuthStore } from '~/stores/auth.store';
import { ROLES_MANAGEMENT } from '~/lib/nav-roles';
import type { LucideIcon } from 'lucide-react';

function canSeeNavItem(
  role: string | undefined,
  itemRoles?: readonly string[]
): boolean {
  if (!itemRoles?.length) return true;
  return role != null && itemRoles.includes(role);
}

export async function clientLoader() {
  const { isAuthenticated, setAuth, setLoading } = useAuthStore.getState();
  if (!isAuthenticated) {
    try {
      const data = await authService.refresh();
      setAuth(data.user, data.accessToken);
    } catch {
      setLoading(false);
      throw redirect('/login');
    }
  }

  let setupRequired = false;
  try {
    const status = await setupService.getSetupStatus();
    setupRequired = status.setupRequired;
  } catch {
    console.error('Error getting setup status');
  }

  if (setupRequired) {
    setLoading(false);
    throw redirect('/setup');
  }

  setLoading(false);
  return null;
}

const NAV_GROUPS: {
  label: string | null;
  items: {
    href: string;
    label: string;
    icon: LucideIcon;
    roles?: readonly string[];
  }[];
}[] = [
  {
    label: null,
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        href: '/reports',
        label: 'Reports',
        icon: BarChart2,
        roles: ['super_admin', 'admin'] as const,
      },

      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'People',
    items: [
      {
        href: '/employees',
        label: 'Employees',
        icon: Users,
        roles: ROLES_MANAGEMENT,
      },
      {
        href: '/org-chart',
        label: 'Org Chart',
        icon: GitBranch,
        roles: ROLES_MANAGEMENT,
      },
      { href: '/leave-requests', label: 'Leave Requests', icon: CalendarDays },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/documents', label: 'Documents', icon: FileText },
    ],
  },
];

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="h-full">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold leading-none tracking-tight text-sidebar-foreground">
                Coros
              </p>
              {user ? (
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-sidebar-foreground/60">
                  {user.role}
                </p>
              ) : null}
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 w-full">
          {NAV_GROUPS.map((group, gi) => {
            const visibleItems = group.items.filter((item) =>
              canSeeNavItem(user?.role, item.roles)
            );
            if (visibleItems.length === 0) return null;
            return (
              <SidebarGroup key={gi}>
                {group.label ? (
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                ) : null}
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          className="w-60"
                          isActive={isActive}
                          asChild
                          tooltip={item.label}
                        >
                          <Link to={item.href}>
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            );
          })}
          <SidebarDepartmentsSection />
        </SidebarContent>

        {user ? (
          <SidebarFooter>
            <div className="flex items-center gap-2.5 px-2 py-2 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary ring-offset-2 ring-offset-sidebar">
                <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-medium text-sidebar-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[9px] text-sidebar-foreground/60">
                  {user.email}
                </p>
              </div>
              <Button
                aria-label="Sign out"
                className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden"
                onClick={() => void handleLogout()}
                size="icon"
                type="button"
                variant="ghost"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </SidebarFooter>
        ) : null}
      </Sidebar>

      <SidebarInset className="flex h-screen flex-col overflow-hidden">
        <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-5 py-2">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-3" id="page-header" />
          <GlobalSearch />
          <NotificationBell />
        </header>
        <div className="flex-1 overflow-y-auto bg-background text-sm text-foreground">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
