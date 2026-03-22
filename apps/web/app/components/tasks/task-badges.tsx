import { Badge } from '~/components/ui/badge';
import type { TaskPriority, TaskStatus } from '~/services/task.service';

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: { label: 'To Do', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  in_review: { label: 'In Review', className: 'bg-amber-100 text-amber-800' },
  done: { label: 'Done', className: 'bg-green-100 text-green-800' },
};

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', className: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', className: 'bg-amber-100 text-amber-800' },
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-800' },
};

export function StatusBadge({ status }: { status: string }) {
  const config =
    STATUS_CONFIG[status as TaskStatus] ?? {
      label: status,
      className: 'bg-muted text-muted-foreground',
    };
  return <Badge className={config.className}>{config.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config =
    PRIORITY_CONFIG[priority as TaskPriority] ?? {
      label: priority,
      className: 'bg-muted text-muted-foreground',
    };
  return <Badge className={config.className}>{config.label}</Badge>;
}
