// apps/web/app/components/employees/EmployeeCard.tsx
// Card presentation for an employee in grid view on the employees list
import { Link } from 'react-router';
import {
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';
import type { ApiEmployee } from '~/services/employee.service';

type RowStatus = 'active' | 'on_leave' | 'inactive';

function mapStatus(s?: string): RowStatus {
  if (s === 'on_leave') return 'on_leave';
  if (s === 'inactive' || s === 'terminated') return 'inactive';
  return 'active';
}

function StatusBadge({ status }: { status: RowStatus }) {
  const cfg = {
    active: {
      className: 'border-success/30 bg-success-muted text-success',
      label: 'Active',
      dot: 'bg-success',
    },
    on_leave: {
      className: 'border-warning/30 bg-warning-muted text-warning',
      label: 'On leave',
      dot: 'bg-warning',
    },
    inactive: {
      className: 'border-border bg-muted text-muted-foreground',
      label: 'Inactive',
      dot: 'bg-muted-foreground',
    },
  }[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        cfg.className
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 shrink-0 rounded-full', cfg.dot)}
      />
      {cfg.label}
    </Badge>
  );
}

export interface EmployeeCardProps {
  employee: ApiEmployee;
  /** When set (e.g. list row with leave-aware status), overrides `employee.status` for the badge. */
  displayStatus?: RowStatus;
  departmentColor?: string;
  canMutate: boolean;
  onEdit: () => void;
  onDeactivate?: () => void;
  onActivate?: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function EmployeeCard({
  employee,
  displayStatus,
  departmentColor,
  canMutate,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  onClick,
}: EmployeeCardProps) {
  const name = `${employee.firstName} ${employee.lastName}`.trim() || '—';
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const email = employee.user?.email?.trim() || '—';
  const phone = employee.phone?.trim() || '—';
  const position = employee.position?.name?.trim() || '—';
  const departmentName = employee.department?.name?.trim() || '—';
  const status = displayStatus ?? mapStatus(employee.status);
  const profilePath = `/employees/${employee.id}`;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border transition-shadow hover:shadow-md',
        'cursor-pointer'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="absolute left-3 top-3 z-10">
        <StatusBadge status={status} />
      </div>

      {canMutate ? (
        <div className="absolute right-2 top-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
                aria-label="Employee actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              {onDeactivate ? (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onDeactivate();
                  }}
                >
                  <UserX className="mr-2 h-3.5 w-3.5" />
                  Deactivate account
                </DropdownMenuItem>
              ) : null}
              {onActivate ? (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onActivate();
                  }}
                >
                  <UserCheck className="mr-2 h-3.5 w-3.5" />
                  Activate account
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete();
                }}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <CardContent className="flex flex-col gap-3 p-4 pt-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
            {employee.avatar ? (
              <AvatarImage
                alt={name}
                src={employee.avatar}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                'text-lg font-semibold',
                !departmentColor && 'bg-primary text-primary-foreground'
              )}
              style={
                departmentColor
                  ? { backgroundColor: departmentColor, color: '#fff' }
                  : undefined
              }
            >
              {initials || '—'}
            </AvatarFallback>
          </Avatar>
          <p className="text-base font-semibold leading-tight text-foreground">
            {name}
          </p>
          <p className="text-sm text-muted-foreground">{position}</p>
          <Badge
            variant="secondary"
            className="gap-1.5"
            title={departmentName}
          >
            <span
              aria-hidden
              className={cn(
                'size-2 shrink-0 rounded-full',
                !departmentColor && 'bg-primary'
              )}
              style={
                departmentColor
                  ? { backgroundColor: departmentColor }
                  : undefined
              }
            />
            <span className="max-w-[14rem] truncate">{departmentName}</span>
          </Badge>
        </div>

        <div className="border-t border-border" />

        <div className="flex flex-col gap-2">
          <div className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground">
            <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{email}</span>
          </div>
          <div className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground">
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{phone}</span>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <Link to={profilePath}>View profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
