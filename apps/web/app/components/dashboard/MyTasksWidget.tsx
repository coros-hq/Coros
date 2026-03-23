// MyTasksWidget.tsx
// Tasks assigned to current user, grouped by priority

import { useMemo } from 'react';
import { Link } from 'react-router';
import { format, parseISO, isValid } from 'date-fns';
import { CheckSquare, ChevronRight } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { useMyTasks } from '~/hooks/useMyTasks';
import type { ApiTask, TaskPriority } from '~/services/task.service';

const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};
const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  urgent: 'border-destructive/50 bg-destructive/10 text-destructive',
  high: 'border-warning/50 bg-warning-muted text-warning',
  medium: 'border-primary/30 bg-primary/10 text-primary',
  low: 'border-muted bg-muted text-muted-foreground',
};

function formatDueDate(d?: string | null): string {
  if (!d) return 'No date';
  try {
    const date = parseISO(d);
    return isValid(date) ? format(date, 'MMM d') : '—';
  }
  catch {
    return '—';
  }
}

function sortTasks(tasks: ApiTask[]): ApiTask[] {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER.indexOf(a.priority as TaskPriority);
    const pb = PRIORITY_ORDER.indexOf(b.priority as TaskPriority);
    if (pa !== pb) return pa - pb;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export function MyTasksWidget() {
  const { tasks, isLoading, error } = useMyTasks();
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);

  if (error) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckSquare className="size-4" />
          My tasks
        </h2>
        <p className="text-sm text-destructive">{error}</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckSquare className="size-4" />
          My tasks
        </h2>
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      </section>
    );
  }

  if (sorted.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckSquare className="size-4" />
          My tasks
        </h2>
        <p className="py-6 text-center text-sm text-muted-foreground">
          No tasks assigned to you.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CheckSquare className="size-4" />
          My tasks
        </h2>
        <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs">
          <Link to="/projects">
            View all
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
      <ul className="space-y-2">
        {sorted.slice(0, 6).map((task) => {
          const priority = (task.priority ?? 'medium') as TaskPriority;
          return (
            <li key={task.id}>
              <Link
                to={`/projects/${task.projectId}/tasks`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent/10"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {task.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {task.project?.name ?? 'Project'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${PRIORITY_CLASSES[priority]}`}
                  >
                    {PRIORITY_LABELS[priority]}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
