import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, GripVertical, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';

import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { ApiTask } from '~/services/task.service';

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const PRIORITY_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  low: 'secondary',
  medium: 'outline',
  high: 'default',
  urgent: 'destructive',
};

export interface TaskBoardCardProps {
  task: ApiTask;
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskBoardCard({
  task,
  canEdit,
  canDelete,
  canMove,
  onEdit,
  onDelete,
}: TaskBoardCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
      disabled: !canMove,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const assigneeName = task.assignee
    ? `${task.assignee.firstName} ${task.assignee.lastName}`
    : null;
  const dueStr = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;
  const priorityVariant = PRIORITY_VARIANTS[task.priority] ?? 'outline';
  const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group flex transition-colors hover:border-primary/50 hover:shadow-sm ${
        isDragging ? 'opacity-60 shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-3 pb-1">
        {canMove ? (
          <div
            className="-ml-1 flex shrink-0 cursor-grab touch-none self-stretch rounded px-1 py-2 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="Drag to move"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ) : null}
        <div
          className="min-w-0 flex-1 cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={onEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit();
            }
          }}
        >
          <h4 className="line-clamp-2 text-sm font-medium text-foreground">
            {task.name}
          </h4>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {task.description}
            </p>
          ) : null}
        </div>
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {canEdit && (
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    onEdit();
                  }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
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
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2 p-3 pt-0">
        <Badge variant={priorityVariant} className="text-[10px]">
          {priorityLabel}
        </Badge>
        {assigneeName ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{assigneeName}</span>
          </span>
        ) : null}
        {dueStr ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {dueStr}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
