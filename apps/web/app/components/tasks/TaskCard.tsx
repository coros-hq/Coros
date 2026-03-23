import { format } from 'date-fns';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  PriorityBadge,
  StatusBadge,
  STATUS_CONFIG,
} from '~/components/tasks/task-badges';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type { ApiTask, TaskStatus } from '~/services/task.service';

const COLUMN_STATUSES: TaskStatus[] = [
  'todo',
  'in_progress',
  'in_review',
  'done',
];

export interface TaskCardProps {
  task: ApiTask;
  canMutate: boolean;
  /** Show delete in menu (e.g. false for assignees who may only edit). */
  canDelete?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  /** Dynamic board columns — when set, "Move to" uses column ids. */
  columns?: ApiKanbanColumn[];
  onColumnChange?: (task: ApiTask, columnId: string) => void;
  /** Legacy fixed statuses when `columns` is not used. */
  onStatusChange?: (task: ApiTask, newStatus: TaskStatus) => void;
}

export function TaskCard({
  task,
  canMutate,
  canDelete = true,
  onEdit,
  onDelete,
  columns,
  onColumnChange,
  onStatusChange,
}: TaskCardProps) {
  const initials = task.assignee
    ? `${task.assignee.firstName?.[0] ?? ''}${task.assignee.lastName?.[0] ?? ''}`.trim() ||
      '?'
    : '';

  const moveTargets =
    columns?.filter((c) => c.id !== task.kanbanColumnId) ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      onClick={() => onEdit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{task.name}</p>
        {canMutate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Task actions"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              {moveTargets.length > 0 && onColumnChange ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {moveTargets.map((c) => (
                      <DropdownMenuItem
                        key={c.id}
                        onSelect={(e) => {
                          e.preventDefault();
                          onColumnChange(task, c.id);
                        }}
                      >
                        {c.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : onStatusChange ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {COLUMN_STATUSES.filter((s) => s !== task.status).map(
                      (s) => (
                        <DropdownMenuItem
                          key={s}
                          onSelect={(e) => {
                            e.preventDefault();
                            onStatusChange(task, s);
                          }}
                        >
                          {STATUS_CONFIG[s].label}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
              {canDelete ? (
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
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {task.description ? (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      ) : null}
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <PriorityBadge priority={task.priority} />
        {task.kanbanColumn?.name ? (
          <Badge variant="outline" className="font-normal">
            {task.kanbanColumn.name}
          </Badge>
        ) : (
          <StatusBadge status={task.status} />
        )}
        {task.dueDate ? (
          <span className="text-xs text-muted-foreground ml-auto">
            {format(new Date(task.dueDate), 'MMM dd')}
          </span>
        ) : null}
      </div>
      {task.assignee ? (
        <div className="flex items-center gap-1.5 mt-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {task.assignee.firstName} {task.assignee.lastName}
          </span>
        </div>
      ) : null}
    </div>
  );
}
