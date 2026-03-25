import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';

import { RichTextEditor } from '~/components/editor/RichTextEditor';
import { TaskComment } from '~/components/tasks/TaskComment';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { Skeleton } from '~/components/ui/skeleton';
import { DatePicker } from '~/components/ui/date-picker';
import { useAuthStore } from '~/stores/auth.store';
import type { ApiProjectMember } from '~/services/project.service';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import {
  createComment,
  deleteComment,
  getComments,
  type ApiTask,
  type ApiTaskComment,
  type TaskPriority,
  type TaskStatus,
  type UpdateTaskDto,
} from '~/services/task.service';

const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'done', label: 'Done' },
];

const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong.';
}

export interface TaskDetailSheetProps {
  task: ApiTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  /** Project key for slug (fallback: task.project?.key). */
  projectKey?: string | null;
  members: ApiProjectMember[];
  columns: ApiKanbanColumn[];
  canMutate: boolean;
  onUpdate: (taskId: string, dto: UpdateTaskDto) => Promise<void>;
  onDelete: (task: ApiTask) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  projectId,
  projectKey,
  members,
  columns,
  canMutate,
  onUpdate,
  onDelete,
}: TaskDetailSheetProps) {
  const user = useAuthStore((s) => s.user);
  const useColumns = columns.length > 0;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kanbanColumnId, setKanbanColumnId] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState<string | undefined>();
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [comments, setComments] = useState<ApiTaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!task) return;
    setName(task.name);
    setDescription(task.description ?? '');
    setKanbanColumnId(task.kanbanColumnId ?? columns[0]?.id ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? undefined);
    setAssigneeId(task.assigneeId ?? '');
    setError(null);
  }, [task, columns]);

  useEffect(() => {
    if (!task) {
      setComments([]);
      return;
    }
    let cancelled = false;
    setCommentsLoading(true);
    getComments(projectId, task.id)
      .then((list) => {
        if (!cancelled) setComments(list);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [task?.id, projectId, task]);

  const patch = useCallback(
    async (dto: UpdateTaskDto) => {
      if (!task || !canMutate) return;
      setSaving(true);
      setError(null);
      try {
        await onUpdate(task.id, dto);
      } catch (e) {
        setError(extractErrorMessage(e));
      } finally {
        setSaving(false);
      }
    },
    [task, canMutate, onUpdate]
  );

  const dateKey = (d: string | undefined | null) =>
    d ? String(d).slice(0, 10) : '';

  const isDirty = useMemo(() => {
    if (!task || !canMutate) return false;
    if (name.trim() !== task.name) return true;
    if ((description || '') !== (task.description ?? '')) return true;
    if (priority !== task.priority) return true;
    if ((assigneeId || '') !== (task.assigneeId ?? '')) return true;
    if (dateKey(dueDate) !== dateKey(task.dueDate)) return true;
    if (useColumns) {
      const fallback = columns[0]?.id ?? '';
      const prevCol = task.kanbanColumnId ?? fallback;
      const nextCol = kanbanColumnId || fallback;
      if (nextCol !== prevCol) return true;
    } else if (status !== task.status) {
      return true;
    }
    return false;
  }, [
    task,
    canMutate,
    name,
    description,
    priority,
    assigneeId,
    dueDate,
    kanbanColumnId,
    status,
    useColumns,
    columns,
  ]);

  const handleSave = useCallback(async () => {
    if (!task || !canMutate || !isDirty) return;
    const dto: UpdateTaskDto = {};
    if (name.trim() !== task.name) dto.name = name.trim();
    if ((description || '') !== (task.description ?? '')) {
      dto.description = description || null;
    }
    if (priority !== task.priority) dto.priority = priority;
    const nextAssignee = assigneeId || '';
    const prevAssignee = task.assigneeId ?? '';
    if (nextAssignee !== prevAssignee) dto.assigneeId = nextAssignee || null;
    if (dateKey(dueDate) !== dateKey(task.dueDate)) {
      dto.dueDate = dueDate ?? null;
    }
    if (useColumns) {
      const fallback = columns[0]?.id ?? '';
      const prevCol = task.kanbanColumnId ?? fallback;
      const nextCol = kanbanColumnId || fallback;
      if (nextCol && nextCol !== prevCol) dto.kanbanColumnId = nextCol;
    } else if (status !== task.status) {
      dto.status = status;
    }
    if (Object.keys(dto).length === 0) return;
    await patch(dto);
  }, [
    task,
    canMutate,
    isDirty,
    name,
    description,
    priority,
    assigneeId,
    dueDate,
    kanbanColumnId,
    status,
    useColumns,
    columns,
    patch,
  ]);

  const slugLabel = useMemo(() => {
    if (!task) return '';
    const key = projectKey ?? task.project?.key ?? '';
    const num = task.number;
    if (!key || num == null) return '—';
    return `${key}-${num}`;
  }, [task, projectKey]);

  const canDeleteComment = useCallback(
    (c: ApiTaskComment) =>
      c.authorId === user?.id ||
      user?.role === 'admin' ||
      user?.role === 'super_admin' ||
      user?.role === 'manager',
    [user?.id, user?.role]
  );

  const handleCommentSubmit = async (html: string) => {
    if (!task) return;
    try {
      const c = await createComment(projectId, task.id, html);
      setComments((prev) => [...prev, c]);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!task) return;
    await deleteComment(projectId, task.id, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-lg"
      >
        {task ? (
          <>
            <SheetHeader className="space-y-1 text-left">
              <SheetTitle className="pr-8">Task</SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {slugLabel}
                </Badge>
                {!canMutate ? (
                  <p className="text-sm text-muted-foreground">
                    View only — you don&apos;t have permission to edit tasks.
                  </p>
                ) : null}
              </div>
            </SheetHeader>

            <div className="mt-4 flex flex-1 flex-col gap-5 pb-6">
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="detail-task-name">Name</Label>
                <Input
                  id="detail-task-name"
                  value={name}
                  disabled={!canMutate || saving}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{useColumns ? 'Column' : 'Status'}</Label>
                  {useColumns ? (
                    <Select
                      value={kanbanColumnId || columns[0]?.id}
                      disabled={!canMutate || saving}
                      onValueChange={(v) => setKanbanColumnId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select
                      value={status}
                      disabled={!canMutate || saving}
                      onValueChange={(v) => setStatus(v as TaskStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    disabled={!canMutate || saving}
                    onValueChange={(v) => setPriority(v as TaskPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select
                    value={assigneeId ? assigneeId : 'none'}
                    disabled={!canMutate || saving}
                    onValueChange={(v) =>
                      setAssigneeId(v === 'none' ? '' : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {members.map((m) => {
                        const emp = m.employee;
                        const label = emp
                          ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
                          : 'Unknown';
                        return (
                          <SelectItem key={m.id} value={m.employeeId}>
                            {label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <DatePicker
                    value={dueDate}
                    disabled={!canMutate || saving}
                    onChange={(d) => setDueDate(d)}
                    placeholder="No due date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <RichTextEditor
                  key={`desc-${task.id}`}
                  content={description}
                  editable={canMutate}
                  showToolbar
                  minHeight="120px"
                  placeholder="Add details…"
                  onChange={setDescription}
                />
              </div>

              {canMutate ? (
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    className="w-full"
                    disabled={saving || !isDirty}
                    onClick={() => void handleSave()}
                  >
                    {saving ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={saving}
                    onClick={() => onDelete(task)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete task
                  </Button>
                </div>
              ) : null}

              <Separator className="my-2" />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Comments {comments.length > 0 ? `(${comments.length})` : ''}
                </h3>

                {commentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                ) : (
                  <ul className="space-y-1">
                    {comments.map((c) => (
                      <li key={c.id}>
                        <TaskComment
                          comment={c}
                          canDelete={canDeleteComment(c)}
                          onDelete={handleCommentDelete}
                        />
                      </li>
                    ))}
                  </ul>
                )}

                <RichTextEditor
                  key={`new-comment-${task.id}`}
                  placeholder="Write a comment…"
                  showToolbar
                  editable
                  minHeight="80px"
                  onSubmit={handleCommentSubmit}
                />
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
