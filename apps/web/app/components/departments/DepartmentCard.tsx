import { MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';

import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { DEPARTMENT_COLORS } from '~/constants/department-colors';
import type { ApiDepartment } from '~/services/department.service';

export interface DepartmentCardProps {
  department: ApiDepartment & { employeeCount?: number };
  canMutate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function DepartmentCard({
  department,
  canMutate,
  onEdit,
  onDelete,
  onClick,
}: DepartmentCardProps) {
  const color = department.color ?? DEPARTMENT_COLORS[0].value;
  const managerLabel = department.manager
    ? `${department.manager.firstName} ${department.manager.lastName}`
    : 'No manager';
  const employeeCount = department.employeeCount ?? 0;

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-medium text-foreground">{department.name}</h3>
        </div>
        {canMutate && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7">
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
        )}
      </div>
      <p className="text-sm text-muted-foreground">{managerLabel}</p>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{employeeCount} employees</span>
      </div>
    </div>
  );
}
