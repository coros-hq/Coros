import { format } from 'date-fns';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Columns3,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { StatusBadge } from '~/components/tasks/task-badges';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type { ApiTask, TaskStatus } from '~/services/task.service';

export function PriorityIcon({ priority }: { priority: string }) {
  const config =
    {
      urgent: { icon: AlertCircle, className: 'text-red-500' },
      high: { icon: ArrowUp, className: 'text-orange-500' },
      medium: { icon: ArrowRight, className: 'text-blue-500' },
      low: { icon: ArrowDown, className: 'text-muted-foreground' },
    }[priority] ?? { icon: ArrowRight, className: 'text-muted-foreground' };

  const Icon = config.icon;
  return <Icon className={cn('h-4 w-4 shrink-0', config.className)} />;
}

function SectionStatusIcon({ column }: { column: ApiKanbanColumn }) {
  const sk = column.statusKey as TaskStatus | null;
  const common = 'h-3.5 w-3.5 shrink-0 text-muted-foreground';
  if (sk === 'todo') return <Circle className={common} />;
  if (sk === 'in_progress') return <Clock className={common} />;
  if (sk === 'in_review') return <Eye className={common} />;
  if (sk === 'done') return <CheckCircle2 className={common} />;
  return <Columns3 className={common} />;
}

export function tasksInColumn(
  tasks: ApiTask[],
  column: ApiKanbanColumn,
  columns: ApiKanbanColumn[]
): ApiTask[] {
  return tasks.filter((t) => {
    let cid = t.kanbanColumnId;
    if (!cid || !columns.some((c) => c.id === cid)) {
      cid = columns.find((c) => c.statusKey === t.status)?.id;
    }
    return cid === column.id;
  });
}

export interface TaskListViewProps {
  columns: ApiKanbanColumn[];
  tasks: ApiTask[];
  canMutate: boolean;
  onEditTask: (task: ApiTask) => void;
  onDeleteTask: (task: ApiTask) => void;
  /** Inline quick-add: Enter saves, Escape cancels */
  onQuickAddTask: (columnId: string, name: string) => Promise<void>;
}

export function TaskListView({
  columns,
  tasks,
  canMutate,
  onEditTask,
  onDeleteTask,
  onQuickAddTask,
}: TaskListViewProps) {
  const [openByColumn, setOpenByColumn] = useState<Record<string, boolean>>(
    {}
  );
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(
    null
  );
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddBusy, setQuickAddBusy] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  const isOpen = (columnId: string) => openByColumn[columnId] !== false;

  const toggle = (columnId: string) => {
    setOpenByColumn((prev) => {
      const wasOpen = prev[columnId] !== false;
      return { ...prev, [columnId]: !wasOpen };
    });
  };

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.position - b.position),
    [columns]
  );

  useEffect(() => {
    if (quickAddColumnId && quickInputRef.current) {
      quickInputRef.current.focus();
    }
  }, [quickAddColumnId]);

  const startQuickAdd = (columnId: string) => {
    setQuickAddColumnId(columnId);
    setQuickAddValue('');
    setOpenByColumn((prev) => ({ ...prev, [columnId]: true }));
  };

  const cancelQuickAdd = () => {
    setQuickAddColumnId(null);
    setQuickAddValue('');
  };

  const submitQuickAdd = async () => {
    if (!quickAddColumnId || quickAddBusy) return;
    const name = quickAddValue.trim();
    if (!name) {
      cancelQuickAdd();
      return;
    }
    setQuickAddBusy(true);
    try {
      await onQuickAddTask(quickAddColumnId, name);
      cancelQuickAdd();
    } finally {
      setQuickAddBusy(false);
    }
  };

  const showEmpty = tasks.length === 0;
  const hasColumns = sortedColumns.length > 0;

  if (showEmpty && !hasColumns) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card py-16 text-center">
        <CheckSquare className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No tasks yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add columns or create a task from the toolbar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border bg-card">
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-2">
        <span className="w-4" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Task
        </span>
        <span className="w-24 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Assignee
        </span>
        <span className="w-24 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        <span className="w-20 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Due
        </span>
      </div>

      {sortedColumns.map((col) => {
        const colTasks = tasksInColumn(tasks, col, columns);
        const open = isOpen(col.id);
        return (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center gap-2 border-y border-border bg-muted/30 px-4 py-2">
              <button
                type="button"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-expanded={open}
                onClick={() => toggle(col.id)}
              >
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              <SectionStatusIcon column={col} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {col.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {colTasks.length}
              </span>
              {canMutate ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-7 w-7"
                  onClick={() => startQuickAdd(col.id)}
                  aria-label={`Add task in ${col.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>

            {open && quickAddColumnId === col.id ? (
              <div className="border-b border-border px-4 py-2">
                <Input
                  ref={quickInputRef}
                  placeholder="Task name…"
                  value={quickAddValue}
                  disabled={quickAddBusy}
                  onChange={(e) => setQuickAddValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void submitQuickAdd();
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelQuickAdd();
                    }
                  }}
                />
              </div>
            ) : null}

            {open
              ? colTasks.map((task) => (
                  <div
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    className="group grid cursor-pointer grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-accent/50"
                    onClick={() => onEditTask(task)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEditTask(task);
                      }
                    }}
                  >
                    <PriorityIcon priority={task.priority} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {task.name}
                      </p>
                      {task.description ? (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex w-24 justify-center">
                      {task.assignee ? (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[9px]">
                            {task.assignee.firstName?.[0] ?? ''}
                            {task.assignee.lastName?.[0] ?? ''}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="flex w-24 justify-center">
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="flex w-20 items-center justify-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate
                          ? format(new Date(task.dueDate), 'MMM dd')
                          : '—'}
                      </span>
                      {canMutate ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                onEditTask(task);
                              }}
                            >
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                onDeleteTask(task);
                              }}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </div>
                ))
              : null}
          </div>
        );
      })}
    </div>
  );
}
