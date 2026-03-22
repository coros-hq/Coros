import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { TaskCard } from '~/components/tasks/TaskCard';
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type { ApiTask } from '~/services/task.service';

/** Stable droppable id: canonical status for default columns, else column uuid. */
export function getColumnDroppableId(col: ApiKanbanColumn): string {
  return col.statusKey ?? col.id;
}

function resolveTargetColumn(
  overId: string,
  cols: ApiKanbanColumn[],
  taskList: ApiTask[]
): ApiKanbanColumn | undefined {
  const byDroppable = cols.find((c) => getColumnDroppableId(c) === overId);
  if (byDroppable) return byDroppable;
  const overTask = taskList.find((t) => t.id === overId);
  if (!overTask) return undefined;
  let cid = overTask.kanbanColumnId;
  if (!cid || !cols.some((c) => c.id === cid)) {
    cid = cols.find((c) => c.statusKey === overTask.status)?.id;
  }
  return cols.find((c) => c.id === cid);
}

function applyTaskToColumn(task: ApiTask, col: ApiKanbanColumn): ApiTask {
  const nextStatus = col.statusKey
    ? (col.statusKey as ApiTask['status'])
    : task.status;
  return {
    ...task,
    kanbanColumnId: col.id,
    status: nextStatus,
    kanbanColumn: {
      id: col.id,
      name: col.name,
      statusKey: col.statusKey,
    },
  };
}

function DroppableColumn({
  droppableId,
  children,
}: {
  droppableId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? 'min-h-[100px] rounded-lg ring-2 ring-primary/40 ring-offset-2 ring-offset-background'
          : 'min-h-[100px]'
      }
    >
      {children}
    </div>
  );
}

function DraggableTaskShell({
  task,
  canDrag,
  children,
}: {
  task: ApiTask;
  canDrag: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task },
      disabled: !canDrag,
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-60' : undefined}
    >
      <div className="flex gap-1">
        {canDrag ? (
          <button
            type="button"
            className="mt-1 flex h-8 w-6 shrink-0 cursor-grab touch-none items-start justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
            aria-label="Drag to move task"
            {...listeners}
            {...attributes}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export interface KanbanBoardProps {
  columns: ApiKanbanColumn[];
  tasks: ApiTask[];
  canMutate: boolean;
  canMutateColumns: boolean;
  /** Override drag permission (e.g. assignees moving their own tasks). */
  canDragTask?: (task: ApiTask) => boolean;
  /** Override card menu permission (edit/delete/move). */
  canEditTask?: (task: ApiTask) => boolean;
  /** Delete action (defaults to same as board-level mutations). */
  canDeleteTask?: (task: ApiTask) => boolean;
  onAddTask: (columnId: string) => void;
  /** When set, column + uses inline quick-add (Enter) instead of opening the add flow. */
  onQuickAddTask?: (columnId: string, name: string) => Promise<void>;
  onMoveTask: (taskId: string, columnId: string) => Promise<void>;
  onEditTask: (task: ApiTask) => void;
  onDeleteTask: (task: ApiTask) => void;
  onCreateColumn: (name: string) => Promise<void>;
  onRenameColumn: (columnId: string, name: string) => Promise<void>;
  onDeleteColumn: (column: ApiKanbanColumn) => Promise<void>;
  onReorderColumn: (columnId: string, direction: 'left' | 'right') => Promise<void>;
}

export function KanbanBoard({
  columns,
  tasks,
  canMutate,
  canMutateColumns,
  canDragTask,
  canEditTask,
  canDeleteTask,
  onAddTask,
  onQuickAddTask,
  onMoveTask,
  onEditTask,
  onDeleteTask,
  onCreateColumn,
  onRenameColumn,
  onDeleteColumn,
  onReorderColumn,
}: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<ApiTask[]>(tasks);
  const [activeTask, setActiveTask] = useState<ApiTask | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ApiKanbanColumn | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ApiKanbanColumn | null>(null);
  const [pending, setPending] = useState(false);
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null);
  const [quickAddValue, setQuickAddValue] = useState('');
  const [quickAddBusy, setQuickAddBusy] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);
  /** Always matches latest `localTasks` in this render (avoids stale closure + batching bugs). */
  const localTasksRef = useRef(localTasks);
  localTasksRef.current = localTasks;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (quickAddColumnId && quickInputRef.current) {
      quickInputRef.current.focus();
    }
  }, [quickAddColumnId]);

  const cancelQuickAdd = () => {
    setQuickAddColumnId(null);
    setQuickAddValue('');
  };

  const submitQuickAdd = async () => {
    if (!quickAddColumnId || !onQuickAddTask || quickAddBusy) return;
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

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, ApiTask[]>();
    for (const c of columns) {
      map.set(c.id, []);
    }
    for (const t of localTasks) {
      let cid = t.kanbanColumnId;
      if (!cid || !map.has(cid)) {
        const fallback =
          columns.find((c) => c.statusKey === t.status) ?? columns[0];
        cid = fallback?.id;
      }
      if (cid && map.has(cid)) {
        const bucket = map.get(cid);
        if (bucket) bucket.push(t);
      }
    }
    return map;
  }, [columns, localTasks]);

  function resolveTaskColumnId(task: ApiTask): string | undefined {
    if (task.kanbanColumnId && columns.some((c) => c.id === task.kanbanColumnId)) {
      return task.kanbanColumnId;
    }
    return columns.find((c) => c.statusKey === task.status)?.id;
  }

  const persistMove = async (taskId: string, columnId: string) => {
    const targetCol = columns.find((c) => c.id === columnId);
    if (!targetCol) return;

    const prev = localTasksRef.current;
    const task = prev.find((t) => t.id === taskId);
    if (!task) return;

    const sourceColumnId = resolveTaskColumnId(task);
    if (sourceColumnId === columnId) return;

    const snapshot = prev;

    setLocalTasks((p) =>
      p.map((t) =>
        t.id === taskId ? applyTaskToColumn(t, targetCol) : t
      )
    );

    try {
      await onMoveTask(taskId, columnId);
    } catch {
      setLocalTasks(snapshot);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    const task = e.active.data.current?.task as ApiTask | undefined;
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over || active.id === over.id) return;
    const task = active.data.current?.task as ApiTask | undefined;
    if (!task) return;

    const overId = String(over.id);
    const targetColumn = resolveTargetColumn(
      overId,
      columns,
      localTasksRef.current
    );
    const sourceColumnId = resolveTaskColumnId(task);
    if (!targetColumn || sourceColumnId === targetColumn.id) return;

    void persistMove(task.id, targetColumn.id);
  };

  const submitAddColumn = async () => {
    const name = newColumnName.trim();
    if (!name) return;
    setPending(true);
    try {
      await onCreateColumn(name);
      setNewColumnName('');
      setAddOpen(false);
    } finally {
      setPending(false);
    }
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    const name = renameValue.trim();
    if (!name) return;
    setPending(true);
    try {
      await onRenameColumn(renameTarget.id, name);
      setRenameOpen(false);
      setRenameTarget(null);
    } finally {
      setPending(false);
    }
  };

  const confirmDeleteColumn = async () => {
    if (!deleteTarget) return;
    setPending(true);
    try {
      await onDeleteColumn(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {canMutateColumns ? (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setNewColumnName('');
                setAddOpen(true);
            }}
            >
              <Plus className="h-4 w-4" />
              Add column
            </Button>
          </div>
        ) : null}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-2">
            {columns.map((col, index) => {
              const colTasks = tasksByColumn.get(col.id) ?? [];
              return (
                <div
                  key={col.id}
                  className="flex w-[min(100%,280px)] min-w-[240px] shrink-0 flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {col.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {colTasks.length}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {canMutateColumns ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-label="Move column left"
                            disabled={index === 0 || pending}
                            onClick={() => onReorderColumn(col.id, 'left')}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-label="Move column right"
                            disabled={index >= columns.length - 1 || pending}
                            onClick={() => onReorderColumn(col.id, 'right')}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                aria-label="Column actions"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setRenameTarget(col);
                                  setRenameValue(col.name);
                                  setRenameOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                disabled={columns.length <= 1}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setDeleteTarget(col);
                                }}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ) : null}
                      {canMutate ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          aria-label={`Add task in ${col.name}`}
                          onClick={() => {
                            if (onQuickAddTask) {
                              setQuickAddColumnId(col.id);
                              setQuickAddValue('');
                            } else {
                              onAddTask(col.id);
                            }
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {canMutate && onQuickAddTask && quickAddColumnId === col.id ? (
                    <Input
                      ref={quickInputRef}
                      placeholder="Task name…"
                      value={quickAddValue}
                      disabled={quickAddBusy}
                      className="text-sm"
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
                  ) : null}

                  <DroppableColumn droppableId={getColumnDroppableId(col)}>
                    <div className="flex flex-col gap-2">
                      {colTasks.map((task) => {
                        const allowDrag = canDragTask?.(task) ?? canMutate;
                        const allowEdit = canEditTask?.(task) ?? canMutate;
                        const allowDelete =
                          canDeleteTask?.(task) ?? canMutate;
                        return (
                          <DraggableTaskShell
                            key={task.id}
                            task={task}
                            canDrag={allowDrag}
                          >
                            <TaskCard
                              task={task}
                              columns={columns}
                              canMutate={allowEdit}
                              canDelete={allowDelete}
                              onEdit={() => onEditTask(task)}
                              onDelete={() => onDeleteTask(task)}
                              onColumnChange={(t, columnId) =>
                                void persistMove(t.id, columnId)
                              }
                            />
                          </DraggableTaskShell>
                        );
                      })}
                    </div>
                  </DroppableColumn>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-[260px] opacity-95 shadow-lg">
                <TaskCard
                  task={activeTask}
                  columns={columns}
                  canMutate={false}
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add column</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-col-name">Name</Label>
            <Input
              id="new-col-name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitAddColumn();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newColumnName.trim() || pending}
              onClick={() => void submitAddColumn()}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameOpen}
        onOpenChange={(o) => {
          if (!o) setRenameTarget(null);
          setRenameOpen(o);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename column</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rename-col">Name</Label>
            <Input
              id="rename-col"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submitRename();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!renameValue.trim() || pending}
              onClick={() => void submitRename()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete column</AlertDialogTitle>
            <AlertDialogDescription>
              Tasks in &quot;{deleteTarget?.name}&quot; will be moved to another
              column. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmDeleteColumn()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
