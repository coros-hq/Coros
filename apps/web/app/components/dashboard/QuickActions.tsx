// QuickActions.tsx
// Shortcut buttons: Add employee, New project, Request leave

import { Link } from 'react-router';
import { CalendarDays, FolderKanban, UserPlus } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { useAuthStore } from '~/stores/auth.store';

export function QuickActions() {
  const user = useAuthStore((s) => s.user);
  const canManagePeople = user?.role === 'admin' || user?.role === 'super_admin';
  const canManageProjects = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="flex flex-wrap gap-2">
      {canManagePeople && (
        <Button asChild size="sm" variant="outline" className="gap-2">
          <Link to="/employees">
            <UserPlus className="size-4" />
            Add employee
          </Link>
        </Button>
      )}
      {canManageProjects && (
        <Button asChild size="sm" variant="outline" className="gap-2">
          <Link to="/projects">
            <FolderKanban className="size-4" />
            New project
          </Link>
        </Button>
      )}
      <Button asChild size="sm" variant="outline" className="gap-2">
        <Link to="/leave-requests">
          <CalendarDays className="size-4" />
          Request leave
        </Link>
      </Button>
    </div>
  );
}
