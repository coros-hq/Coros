import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckSquare,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
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
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
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
import { KanbanBoard } from '~/components/tasks/KanbanBoard';
import { TaskDetailSheet } from '~/components/tasks/TaskDetailSheet';
import { TaskForm } from '~/components/tasks/TaskForm';
import { TaskListView } from '~/components/tasks/TaskListView';
import { TaskProgressBar } from '~/components/tasks/TaskProgressBar';
import { EmployeeMultiSelect } from '~/components/projects/EmployeeMultiSelect';
import { ProjectForm } from '~/components/projects/ProjectForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useKanbanColumns } from '~/hooks/useKanbanColumns';
import { useProjectDetail } from '~/hooks/useProjectDetail';
import { useTasks } from '~/hooks/useTasks';
import { cn } from '~/lib/utils';
import { useAuthStore } from '~/stores/auth.store';
import { listEmployees } from '~/services/employee.service';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type { ApiTask, TaskStatus, UpdateTaskDto } from '~/services/task.service';
import type { TaskFormValues } from '~/components/tasks/TaskForm';

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const headerPortal = useRef<Element | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberEmployeeIds, setAddMemberEmployeeIds] = useState<string[]>([]);
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [allEmployees, setAllEmployees] = useState<ApiEmployee[]>([]);
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);
  const [defaultColumnId, setDefaultColumnId] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<ApiTask | null>(null);
  const [taskDeleteError, setTaskDeleteError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const { project, isLoading, error, update, remove, addMember, removeMember } =
    useProjectDetail(id);

  const {
    tasks,
    isLoading: tasksLoading,
    error: tasksError,
    create: createTask,
    update: updateTask,
    remove: removeTask,
    refetch: refetchTasks,
  } = useTasks(id);

  const {
    columns,
    isLoading: columnsLoading,
    error: columnsError,
    create: createKanbanColumn,
    update: updateKanbanColumn,
    remove: removeKanbanColumn,
    reorder: reorderKanbanColumns,
  } = useKanbanColumns(id);

  const user = useAuthStore((s) => s.user);
  const canMutate = user?.role === 'admin' || user?.role === 'super_admin';
  const canMutateTasks =
    user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    headerPortal.current = document.getElementById('page-header');
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (canMutate) {
      listEmployees()
        .then(setAllEmployees)
        .catch(() => setAllEmployees([]));
    }
  }, [canMutate]);

  const handleUpdateSubmit = async (values: {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    if (!project) return;
    await update({
      name: values.name,
      description: values.description,
      status: values.status as
        | 'planning'
        | 'active'
        | 'on_hold'
        | 'completed'
        | 'cancelled',
      startDate: values.startDate,
      endDate: values.endDate,
    });
    setSheetOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!project) return;
    setDeleteError(null);
    try {
      await remove();
      setShowDeleteDialog(false);
      navigate('/projects');
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
    }
  };

  const handleAddMember = async () => {
    if (!id || addMemberEmployeeIds.length === 0) return;
    setAddMemberError(null);
    setAddMemberSubmitting(true);
    try {
      for (const employeeId of addMemberEmployeeIds) {
        await addMember({ employeeId, role: 'member' });
      }
      setAddMemberOpen(false);
      setAddMemberEmployeeIds([]);
    } catch (err) {
      setAddMemberError(extractErrorMessage(err));
    } finally {
      setAddMemberSubmitting(false);
    }
  };

  const handleRemoveMember = async (employeeId: string) => {
    if (!project) return;
    await removeMember(employeeId);
  };

  const handleTaskSheetChange = (open: boolean) => {
    if (!open) {
      setDefaultColumnId('');
    }
    setTaskSheetOpen(open);
  };

  const resolvedTask = useMemo(
    () =>
      selectedTask
        ? tasks.find((t) => t.id === selectedTask.id) ?? selectedTask
        : null,
    [tasks, selectedTask]
  );

  useEffect(() => {
    if (
      taskDetailOpen &&
      selectedTask &&
      !tasks.some((t) => t.id === selectedTask.id)
    ) {
      setTaskDetailOpen(false);
      setSelectedTask(null);
    }
  }, [taskDetailOpen, selectedTask, tasks]);

  const taskCompletedCount = useMemo(
    () => tasks.filter((t) => t.status === 'done').length,
    [tasks]
  );

  const openTaskDetail = (task: ApiTask) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleTaskPanelUpdate = async (taskId: string, dto: UpdateTaskDto) => {
    await updateTask(taskId, dto);
  };

  const handleQuickAddTask = async (columnId: string, name: string) => {
    await createTask({
      name: name.trim(),
      priority: 'medium',
      kanbanColumnId: columnId,
    });
  };

  const handleTaskCreate = async (values: TaskFormValues) => {
    await createTask({
      name: values.name,
      description: values.description,
      status: values.status as TaskStatus | undefined,
      priority: values.priority as 'low' | 'medium' | 'high' | 'urgent',
      dueDate: values.dueDate,
      assigneeId: values.assigneeId,
      kanbanColumnId: values.kanbanColumnId,
    });
    setTaskSheetOpen(false);
  };

  const handleMoveTask = async (taskId: string, columnId: string) => {
    console.log(
      'Updating task',
      taskId,
      'to column',
      columnId,
      'kanbanColumnId',
      columnId
    );
    await updateTask(taskId, { kanbanColumnId: columnId });
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

  const handleTaskDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setTaskDeleteError(null);
    try {
      await removeTask(taskToDelete.id);
      if (selectedTask?.id === taskToDelete.id) {
        setTaskDetailOpen(false);
        setSelectedTask(null);
      }
      setTaskToDelete(null);
    } catch (err) {
      setTaskDeleteError(extractErrorMessage(err));
    }
  };

  const existingMemberIds = project?.members?.map((m) => m.employeeId) ?? [];
  const employeesToAdd = allEmployees.filter(
    (e) => !existingMemberIds.includes(e.id)
  );

  if (!id) {
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
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-8 w-8 shrink-0"
                >
                  <Link to="/projects" aria-label="Back to projects">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex min-w-0 items-center gap-2">
                  {project ? (
                    <>
                      <Badge variant="secondary">
                        {STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                      <h1 className="truncate text-lg font-bold text-foreground">
                        {project.name}
                      </h1>
                    </>
                  ) : (
                    <h1 className="text-lg font-bold text-foreground">
                      Loading…
                    </h1>
                  )}
                </div>
              </div>
              {canMutate && project && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        setSheetOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={(e) => {
                        e.preventDefault();
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>,
            headerPortal.current
          )
        : null}

      <div className="p-6 lg:p-8">
        {error ? (
          <div
            className="mb-4 rounded-xl border border-destructive/25 bg-destructive-muted px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        ) : project ? (
          <>
            {project.description ? (
              <div
                className="prose prose-sm dark:prose-invert mb-6 max-w-none text-muted-foreground prose-p:my-2 prose-ul:my-2"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />
            ) : null}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-2xl font-semibold text-foreground">
                  {project.members?.length ?? 0}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Tasks</p>
                <p className="text-2xl font-semibold text-foreground">
                  {tasksLoading ? project.tasks?.length ?? 0 : tasks.length}
                </p>
                {!tasksLoading && tasks.length > 0 ? (
                  <TaskProgressBar
                    completed={taskCompletedCount}
                    total={tasks.length}
                    className="mt-3"
                  />
                ) : null}
              </div>
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-foreground">
                  {STATUS_LABELS[project.status] ?? project.status}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <Users className="h-4 w-4" />
                    Members
                  </h2>
                  {canMutate && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setAddMemberOpen(true);
                        setAddMemberEmployeeId('');
                        setAddMemberError(null);
                      }}
                      className="gap-1.5"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add member
                    </Button>
                  )}
                </div>
                {!project.members?.length ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      No members in this project
                    </p>
                    {canMutate && (
                      <Button
                        variant="link"
                        className="mt-2"
                        onClick={() => setAddMemberOpen(true)}
                      >
                        Add member
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          {canMutate ? <TableHead className="w-12" /> : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project.members.map((m) => {
                          const emp = m.employee;
                          const name = emp
                            ? `${emp.firstName ?? ''} ${
                                emp.lastName ?? ''
                              }`.trim()
                            : 'Unknown';
                          const initials = name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                          const isOwner = m.role === 'owner';
                          return (
                            <TableRow key={m.id}>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                                      {initials || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">
                                    {name}
                                  </span>
                                  {isOwner ? (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Owner
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground capitalize">
                                {m.role}
                              </TableCell>
                              {canMutate ? (
                                <TableCell className="w-12">
                                  {!isOwner && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() =>
                                        handleRemoveMember(m.employeeId)
                                      }
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </TableCell>
                              ) : null}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <CheckSquare className="h-4 w-4" />
                      Tasks
                    </h2>
                    {!tasksLoading && tasks.length > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {taskCompletedCount} of {tasks.length} completed
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="flex items-center rounded-md border border-border"
                      role="group"
                      aria-label="Task view mode"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 rounded-none rounded-l-md',
                          viewMode === 'kanban' && 'bg-accent'
                        )}
                        onClick={() => setViewMode('kanban')}
                        aria-pressed={viewMode === 'kanban'}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 rounded-none rounded-r-md',
                          viewMode === 'list' && 'bg-accent'
                        )}
                        onClick={() => setViewMode('list')}
                        aria-pressed={viewMode === 'list'}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    {canMutateTasks ? (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setDefaultColumnId(columns[0]?.id ?? '');
                          setTaskSheetOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Add task
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="gap-1.5"
                    >
                      <Link to={`/projects/${id}/tasks`}>Full page</Link>
                    </Button>
                  </div>
                </div>
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
                {tasksLoading || columnsLoading ? (
                  <div className="flex items-center justify-center rounded-lg border border-dashed bg-muted/30 py-16">
                    <p className="text-sm text-muted-foreground">
                      Loading board…
                    </p>
                  </div>
                ) : viewMode === 'kanban' ? (
                  <KanbanBoard
                    columns={columns}
                    tasks={tasks}
                    projectKey={project?.key}
                    canMutate={canMutateTasks}
                    canMutateColumns={canMutateTasks}
                    onAddTask={(columnId) => {
                      setDefaultColumnId(columnId);
                      setTaskSheetOpen(true);
                    }}
                    onQuickAddTask={handleQuickAddTask}
                    onMoveTask={(taskId, columnId) =>
                      handleMoveTask(taskId, columnId)
                    }
                    onEditTask={(task) => openTaskDetail(task)}
                    onDeleteTask={(task) => setTaskToDelete(task)}
                    onCreateColumn={handleCreateColumn}
                    onRenameColumn={handleRenameColumn}
                    onDeleteColumn={handleDeleteColumn}
                    onReorderColumn={handleReorderColumn}
                  />
                ) : (
                  <TaskListView
                    columns={columns}
                    tasks={tasks}
                    projectKey={project?.key}
                    canMutate={canMutateTasks}
                    onEditTask={(task) => openTaskDetail(task)}
                    onDeleteTask={(task) => setTaskToDelete(task)}
                    onQuickAddTask={handleQuickAddTask}
                  />
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit project</SheetTitle>
          </SheetHeader>
          {project && (
            <ProjectForm
              mode="edit"
              project={project}
              employees={allEmployees}
              onSubmit={handleUpdateSubmit}
              onCancel={() => setSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={taskSheetOpen} onOpenChange={handleTaskSheetChange}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add task</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-0">
            <TaskForm
              key={`new-${defaultColumnId}`}
              mode="create"
              members={project?.members ?? []}
              columns={columns}
              defaultColumnId={defaultColumnId}
              onSubmit={handleTaskCreate}
              onCancel={() => handleTaskSheetChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {project ? (
        <TaskDetailSheet
          task={resolvedTask}
          open={taskDetailOpen}
          onOpenChange={(open) => {
            setTaskDetailOpen(open);
            if (!open) setSelectedTask(null);
          }}
          projectId={id ?? ''}
          projectKey={project?.key}
          members={project.members ?? []}
          columns={columns}
          canMutate={canMutateTasks}
          onUpdate={handleTaskPanelUpdate}
          onDelete={(task) => {
            setTaskToDelete(task);
          }}
        />
      ) : null}

      <Dialog
        open={addMemberOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddMemberOpen(false);
            setAddMemberEmployeeIds([]);
            setAddMemberError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {addMemberError ? (
              <p className="text-sm text-destructive" role="alert">
                {addMemberError}
              </p>
            ) : null}
            <div className="space-y-2">
              <label className="text-sm font-medium">Employees</label>
              <EmployeeMultiSelect
                employees={employeesToAdd}
                value={addMemberEmployeeIds}
                onChange={setAddMemberEmployeeIds}
                disabled={addMemberSubmitting || employeesToAdd.length === 0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddMemberOpen(false);
                setAddMemberEmployeeIds([]);
              }}
              disabled={addMemberSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={
                addMemberEmployeeIds.length === 0 ||
                employeesToAdd.length === 0 ||
                addMemberSubmitting
              }
            >
              {addMemberSubmitting
                ? 'Adding…'
                : addMemberEmployeeIds.length > 1
                  ? `Add ${addMemberEmployeeIds.length} members`
                  : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteDialog(false);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {project?.name}? All tasks will be
              deleted. This action cannot be undone.
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

      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null);
            setTaskDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {taskToDelete?.name}? This action
              cannot be undone.
              {taskDeleteError ? (
                <span className="mt-2 block text-destructive">
                  {taskDeleteError}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleTaskDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
