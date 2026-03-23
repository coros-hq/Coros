import { useEffect, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { Textarea } from '~/components/ui/textarea';
import { DatePicker } from '~/components/ui/date-picker';
import type { ApiProjectMember } from '~/services/project.service';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type {
  ApiTask,
  TaskPriority,
  TaskStatus,
  UpdateTaskDto,
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

export interface TaskDetailPanelProps {
  task: ApiTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: ApiProjectMember[];
  columns: ApiKanbanColumn[];
  canMutate: boolean;
  onUpdate: (taskId: string, dto: UpdateTaskDto) => Promise<void>;
  onDelete: (task: ApiTask) => void;
}

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  members,
  columns,
  canMutate,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
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

  async function patch(dto: UpdateTaskDto) {
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
  }

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="pr-8">Task</SheetTitle>
          {!canMutate ? (
            <p className="text-sm text-muted-foreground">
              View only — you don&apos;t have permission to edit tasks.
            </p>
          ) : null}
        </SheetHeader>

        <div className="mt-6 flex flex-1 flex-col gap-5 pb-6">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="panel-task-name">Name</Label>
            <Input
              id="panel-task-name"
              value={name}
              disabled={!canMutate || saving}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-task-desc">Description</Label>
            <Textarea
              id="panel-task-desc"
              rows={4}
              placeholder="Add details…"
              value={description}
              disabled={!canMutate || saving}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {useColumns ? (
                <>
                  <Label>Column</Label>
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
                </>
              ) : (
                <>
                  <Label>Status</Label>
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
                </>
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

          {canMutate ? (
            <div className="mt-auto flex flex-col gap-2 border-t pt-4">
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  const dto: UpdateTaskDto = {
                    name: name.trim(),
                    description: description.trim() || null,
                    priority,
                    dueDate: dueDate ?? null,
                    assigneeId: assigneeId || null,
                  };
                  if (useColumns) {
                    dto.kanbanColumnId =
                      kanbanColumnId || columns[0]?.id || null;
                  } else {
                    dto.status = status;
                  }
                  void patch(dto);
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving…' : 'Update'}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
