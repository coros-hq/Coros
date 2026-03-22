import { FolderKanban, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';

import { TaskProgressBar } from '~/components/tasks/TaskProgressBar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { ApiProject } from '~/services/project.service';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  planning: 'secondary',
  active: 'default',
  on_hold: 'outline',
  completed: 'secondary',
  cancelled: 'destructive',
};

export interface ProjectCardProps {
  project: ApiProject;
  canMutate: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

export function ProjectCard({
  project,
  canMutate,
  onEdit,
  onDelete,
  onClick,
}: ProjectCardProps) {
  const memberCount = project.memberCount ?? project.members?.length ?? 0;
  const taskCount = project.taskCount ?? project.tasks?.length ?? 0;
  const completedCount = project.completedTaskCount ?? 0;
  const statusLabel = STATUS_LABELS[project.status] ?? project.status;
  const statusVariant = STATUS_VARIANTS[project.status] ?? 'secondary';

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
          <FolderKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
          <h3 className="font-medium text-foreground">{project.name}</h3>
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
      {project.description ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant}>{statusLabel}</Badge>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{memberCount} members</span>
        </div>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">
          {taskCount} tasks
        </span>
      </div>
      {taskCount > 0 ? (
        <TaskProgressBar
          completed={completedCount}
          total={taskCount}
          className="mt-1"
        />
      ) : null}
    </div>
  );
}
