import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { KanbanBoard } from '~/components/tasks/KanbanBoard';
import { TaskDetailSheet } from '~/components/tasks/TaskDetailSheet';
import { TaskForm, type TaskFormValues } from '~/components/tasks/TaskForm';
import { useKanbanColumns } from '~/hooks/useKanbanColumns';
import { useProjectDetail } from '~/hooks/useProjectDetail';
import { useTasks } from '~/hooks/useTasks';
import { useAuthStore } from '~/stores/auth.store';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type {
  ApiTask,
  TaskStatus,
  UpdateTaskDto,
} from '~/services/task.service';

const STATUS_LABELS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};

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

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export default function ProjectTasksPage() {
  const { id: projectId } = useParams();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ApiTask | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [defaultColumnId, setDefaultColumnId] = useState('');

  const { project, isLoading: projectLoading } = useProjectDetail(projectId);
  const {
    tasks,
    isLoading: tasksLoading,
    error: tasksError,
    create,
    update,
    remove,
    refetch: refetchTasks,
  } = useTasks(projectId);
  const {
    columns,
    isLoading: columnsLoading,
    error: columnsError,
    create: createKanbanColumn,
    update: updateKanbanColumn,
    remove: removeKanbanColumn,
    reorder: reorderKanbanColumns,
  } = useKanbanColumns(projectId);

  const user = useAuthStore((s) => s.user);
  const canMutate =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'manager';
  const canUpdateOwnTasks =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'manager' ||
    user?.role === 'employee';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  const resolvedTask = useMemo(
    () =>
      selectedTask
        ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask
        : null,
    [tasks, selectedTask]
  );

  useEffect(() => {
    if (
      detailSheetOpen &&
      selectedTask &&
      !tasks.some((t) => t.id === selectedTask.id)
    ) {
      setDetailSheetOpen(false);
      setSelectedTask(null);
    }
  }, [detailSheetOpen, selectedTask, tasks]);

  const handleCreateSubmit = async (values: TaskFormValues) => {
    await create({
      name: values.name,
      description: values.description,
      status: values.status as TaskStatus | undefined,
      priority: values.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: values.dueDate,
      assigneeId: values.assigneeId,
      kanbanColumnId: values.kanbanColumnId,
    });
    setSheetOpen(false);
  };

  const openTaskDetail = (task: ApiTask) => {
    setSelectedTask(task);
    setDetailSheetOpen(true);
  };

  const handleMoveTask = async (taskId: string, columnId: string) => {
    await update(taskId, { kanbanColumnId: columnId });
  };

  const handleQuickAddTask = async (columnId: string, name: string) => {
    await create({
      name: name.trim(),
      priority: 'medium',
      kanbanColumnId: columnId,
    });
  };

  const handleReorderColumn = async (
    columnId: string,
    direction: 'left' | 'right'
  ) => {
    const idx = columns.findIndex((c) => c.id === columnId);
    if (idx < 0) return;
    const j = direction === 'left' ? idx - 1 : idx + 1;
    if (j < 0 || j >= columns.length) return;
    const orderedIds = columns.map((c) => c.id);
    const [removed] = orderedIds.splice(idx, 1);
    orderedIds.splice(j, 0, removed);
    await reorderKanbanColumns(orderedIds);
  };

  const handleCreateColumn = async (name: string) => {
    await createKanbanColumn(name);
  };

  const handleRenameColumn = async (columnId: string, name: string) => {
    await updateKanbanColumn(columnId, name);
  };

  const handleDeleteColumn = async (col: ApiKanbanColumn) => {
    await removeKanbanColumn(col.id);
    await refetchTasks();
  };

  const canDragOrEditTask = (task: ApiTask) =>
    canMutate ||
    (canUpdateOwnTasks &&
      !!task.assigneeId &&
      !!user?.id &&
      task.assignee?.user?.id === user.id);

  const handleTaskUpdate = async (taskId: string, dto: UpdateTaskDto) => {
    await update(taskId, dto);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setDeleteError(null);
    try {
      await remove(taskToDelete.id);
      if (selectedTask?.id === taskToDelete.id) {
        setDetailSheetOpen(false);
        setSelectedTask(null);
      }
      setTaskToDelete(null);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const isLoading = projectLoading || tasksLoading || columnsLoading;

  if (!projectId) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Invalid project</p>
      </div>
    );
  }

  return (
    <>
      {portalReady && headerPortal.current
        ? createPortal(
            <div className="flex w-full items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                  <Link to={`/projects/${projectId}`} aria-label="Back to project">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-lg font-bold text-foreground">
                    {project?.name ?? 'Tasks'}
                  </h1>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    Tasks
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex rounded-md border border-input" role="group">
                  <Button
                    variant={viewMode === 'board' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 rounded-r-none px-2.5"
                    onClick={() => setViewMode('board')}
                    aria-pressed={viewMode === 'board'}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 rounded-l-none px-2.5"
                    onClick={() => setViewMode('table')}
                    aria-pressed={viewMode === 'table'}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                {canMutate && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setDefaultColumnId(columns[0]?.id ?? '');
                      setSheetOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Add task
                  </Button>
                )}
              </div>
            </div>,
            headerPortal.current
          )
        : null}

      <div className="p-6 lg:p-8">
        {tasksError ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {tasksError}
          </div>
        ) : null}

        {columnsError ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {columnsError}
          </div>
        ) : null}

        {deleteError ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {deleteError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : (
          <>
            {viewMode === 'board' ? (
              <KanbanBoard
                columns={columns}
                tasks={tasks}
                projectKey={project?.key}
                canMutate={canMutate}
                canMutateColumns={canMutate}
                canDragTask={canDragOrEditTask}
                canEditTask={canDragOrEditTask}
                canDeleteTask={() => canMutate}
                onAddTask={(columnId) => {
                  setDefaultColumnId(columnId);
                  setSheetOpen(true);
                }}
                onQuickAddTask={handleQuickAddTask}
                onMoveTask={handleMoveTask}
                onEditTask={openTaskDetail}
                onDeleteTask={(task) => setTaskToDelete(task)}
                onCreateColumn={handleCreateColumn}
                onRenameColumn={handleRenameColumn}
                onDeleteColumn={handleDeleteColumn}
                onReorderColumn={handleReorderColumn}
              />
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Due date</TableHead>
                      {canMutate ? <TableHead className="w-12" /> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => {
                      const slugKey = project?.key ?? task.project?.key ?? '';
                      const slug =
                        slugKey && task.number != null
                          ? `${slugKey}-${task.number}`
                          : null;
                      const assigneeName = task.assignee
                        ? `${task.assignee.firstName} ${task.assignee.lastName}`
                        : '—';
                      const dueStr = task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : '—';
                      const canEdit =
                        canMutate ||
                        (canUpdateOwnTasks &&
                          task.assigneeId &&
                          user?.id &&
                          task.assignee?.user?.id === user.id);
                      return (
                        <TableRow
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => openTaskDetail(task)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openTaskDetail(task);
                            }
                          }}
                        >
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              {slug ? (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {slug}
                                </span>
                              ) : null}
                              <span className="font-medium text-foreground">
                                {task.name}
                              </span>
                              {task.description ? (
                                <span className="line-clamp-1 text-xs text-muted-foreground">
                                  {task.description}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {task.kanbanColumn?.name ??
                                STATUS_LABELS[task.status] ??
                                task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                PRIORITY_VARIANTS[task.priority] ?? 'outline'
                              }
                            >
                              {PRIORITY_LABELS[task.priority] ?? task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {assigneeName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {dueStr}
                          </TableCell>
                          {canMutate ? (
                            <TableCell
                              className="w-12"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      openTaskDetail(task);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-3.5 w-3.5" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      setTaskToDelete(task);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          ) : canEdit ? (
                            <TableCell
                              className="w-12"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTaskDetail(task)}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>

      {project ? (
        <TaskDetailSheet
          task={resolvedTask}
          open={detailSheetOpen}
          onOpenChange={(open) => {
            setDetailSheetOpen(open);
            if (!open) setSelectedTask(null);
          }}
          projectId={projectId}
          projectKey={project.key}
          members={project.members ?? []}
          columns={columns}
          canMutate={
            !!resolvedTask &&
            (canMutate ||
              (canUpdateOwnTasks &&
                !!resolvedTask.assigneeId &&
                !!user?.id &&
                resolvedTask.assignee?.user?.id === user.id))
          }
          onUpdate={handleTaskUpdate}
          onDelete={(task) => setTaskToDelete(task)}
        />
      ) : null}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add task</SheetTitle>
          </SheetHeader>
          <TaskForm
            key={`new-${defaultColumnId}`}
            mode="create"
            members={project?.members ?? []}
            columns={columns}
            defaultColumnId={defaultColumnId}
            onSubmit={handleCreateSubmit}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {taskToDelete?.name}? This action
              cannot be undone.
              {deleteError ? (
                <span className="mt-2 block text-destructive">
                  {deleteError}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
