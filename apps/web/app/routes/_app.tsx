import { type ReactNode } from 'react';
import { Outlet, redirect, useLocation, useNavigate } from 'react-router';

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
import { authService } from '~/services/auth.service';
import { setupService } from '~/services/setup.service';
import { useAuthStore } from '~/stores/auth.store';

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

  // Check setup status outside any try/catch so the redirect propagates
  // directly to React Router without being swallowed by an instanceof check.
  let setupRequired = false;
  try {
    const status = await setupService.getSetupStatus();
    setupRequired = status.setupRequired;
  } catch {
    // Network / auth failure — don't block access, just proceed.
  }

  if (setupRequired) {
    setLoading(false);
    throw redirect('/setup');
  }

  setLoading(false);
  return null;
}

type IconProps = { className?: string };

const NAV_GROUPS: {
  label: string | null;
  items: { href: string; label: string; icon: (p: IconProps) => ReactNode }[];
  roles?: readonly string[];
}[] = [
  {
    label: null,
    items: [{ href: '/', label: 'Dashboard', icon: IconDashboard }],
  },
  {
    label: 'People',
    items: [
      { href: '/employees', label: 'Employees', icon: IconUsers },
      { href: '/departments', label: 'Departments', icon: IconBuilding },
      { href: '/leave-requests', label: 'Leave Requests', icon: IconCalendar },
    ],
  },
  {
    label: 'Work',
    items: [
      { href: '/projects', label: 'Projects', icon: IconLayers },
      { href: '/documents', label: 'Documents', icon: IconFile },
    ],
  },
  {
    label: 'Admin',
    items: [{ href: '/settings', label: 'Settings', icon: IconSettings }],
    roles: ['admin'] as const,
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
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <CorosIcon className="h-4 w-4 text-primary-foreground" />
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

        <SidebarContent>
          {NAV_GROUPS.map((group, gi) => {
            if (group.roles && user && !group.roles.includes(user.role)) return null;
            return (
              <SidebarGroup key={gi}>
                {group.label ? (
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                ) : null}
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive =
                      item.href === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          render={<a href={item.href} />}
                          tooltip={item.label}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            );
          })}
        </SidebarContent>

        {user ? (
          <SidebarFooter>
            <div className="flex items-center gap-2.5 px-1 py-1 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-7 w-7 shrink-0 ring-2 ring-primary ring-offset-2 ring-offset-sidebar">
                <AvatarFallback className="bg-muted text-[10px] font-semibold text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-medium text-sidebar-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[9px] text-sidebar-foreground/60">{user.email}</p>
              </div>
              <Button
                aria-label="Sign out"
                className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden"
                onClick={() => void handleLogout()}
                size="icon"
                type="button"
                variant="ghost"
              >
                <IconLogout className="h-3.5 w-3.5" />
              </Button>
            </div>
          </SidebarFooter>
        ) : null}
      </Sidebar>

      <SidebarInset>
        <header className="flex min-h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-5 py-2">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 items-center gap-3" id="page-header" />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-background text-sm text-foreground">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function CorosIcon({ className }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path
        clipRule="evenodd"
        d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4zm0 2a4 4 0 100 8 4 4 0 000-8zm0 2a2 2 0 110 4 2 2 0 010-4z"
        fillRule="evenodd"
      />
    </svg>
  );
}

function IconDashboard({ className }: IconProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 16 16">
      <rect height="6" rx="1" width="6" x="1" y="1" />
      <rect height="6" rx="1" width="6" x="9" y="1" />
      <rect height="6" rx="1" width="6" x="1" y="9" />
      <rect height="6" rx="1" width="6" x="9" y="9" />
    </svg>
  );
}

function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M1 13c0-2.8 2.2-5 5-5h0c2.8 0 5 2.2 5 5" strokeLinecap="round" />
      <path d="M11 4a2 2 0 010 4M15 13c0-2.2-1.6-4-3.5-4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconBuilding({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <rect height="11" rx="1" width="9" x="1" y="4" />
      <path d="M10 7h4a1 1 0 011 1v7H10" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <rect height="12" rx="1.5" width="13" x="1.5" y="3" />
      <path d="M1.5 7h13M5 1.5v3M11 1.5v3" strokeLinecap="round" />
    </svg>
  );
}

function IconLayers({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <path d="M8 1.5L14.5 5 8 8.5 1.5 5 8 1.5z" strokeLinejoin="round" />
      <path d="M1.5 9l6.5 3.5L14.5 9" strokeLinecap="round" />
      <path d="M1.5 12l6.5 3.5L14.5 12" strokeLinecap="round" />
    </svg>
  );
}

function IconFile({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <path
        d="M9.5 1.5H3a1 1 0 00-1 1v11a1 1 0 001 1h10a1 1 0 001-1V6.5L9.5 1.5z"
        strokeLinejoin="round"
      />
      <path d="M9.5 1.5V6.5H14.5" strokeLinejoin="round" />
    </svg>
  );
}

function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2.5" />
      <path
        d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLogout({ className }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 16 16">
      <path d="M6 13.5H3a1 1 0 01-1-1v-9a1 1 0 011-1h3" strokeLinecap="round" />
      <path d="M10.5 11l3-3-3-3M13.5 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
