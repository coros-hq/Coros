import { useState } from 'react';
import { z } from 'zod';
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
import { Textarea } from '~/components/ui/textarea';
import { DatePicker } from '~/components/ui/date-picker';
import type { ApiProjectMember } from '~/services/project.service';
import type { ApiKanbanColumn } from '~/services/kanban-column.service';
import type { TaskStatus, TaskPriority } from '~/services/task.service';

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

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  kanbanColumnId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof formSchema>;

type FieldErrors = Partial<Record<keyof TaskFormValues, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export interface TaskFormProps {
  mode: 'create' | 'edit';
  task?: {
    id: string;
    name: string;
    description?: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
    kanbanColumnId?: string | null;
  };
  members: ApiProjectMember[];
  /** Project board columns — when set, form uses column select instead of fixed statuses. */
  columns?: ApiKanbanColumn[];
  /** Preset column when creating (e.g. from Kanban +). */
  defaultColumnId?: string;
  /** @deprecated Use defaultColumnId + columns instead */
  defaultStatus?: TaskStatus;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
  mode,
  task,
  members,
  columns,
  defaultColumnId,
  defaultStatus,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const useColumns = Boolean(columns && columns.length > 0);

  const [values, setValues] = useState<TaskFormValues>(() => {
    if (mode === 'edit' && task) {
      return {
        name: task.name,
        description: task.description ?? '',
        status: task.status,
        kanbanColumnId: task.kanbanColumnId ?? '',
        priority: task.priority,
        dueDate: task.dueDate ?? undefined,
        assigneeId: task.assigneeId ?? '',
      };
    }
    const firstCol = columns?.[0];
    return {
      name: '',
      description: '',
      status: defaultStatus ?? 'todo',
      kanbanColumnId:
        defaultColumnId ?? firstCol?.id ?? '',
      priority: 'medium',
      dueDate: undefined,
      assigneeId: '',
    };
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof TaskFormValues>(
    field: K,
    value: TaskFormValues[K]
  ) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (apiError) setApiError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const result = formSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof TaskFormValues;
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      const data = result.data;
      await onSubmit({
        ...data,
        assigneeId: data.assigneeId || undefined,
        kanbanColumnId: useColumns
          ? data.kanbanColumnId || undefined
          : undefined,
      });
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Task name"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description{' '}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Textarea
          id="description"
          placeholder="Task description..."
          value={values.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {useColumns && columns ? (
            <>
              <Label htmlFor="kanbanColumnId">Column</Label>
              <Select
                value={values.kanbanColumnId || columns[0]?.id}
                onValueChange={(v) => set('kanbanColumnId', v)}
              >
                <SelectTrigger id="kanbanColumnId">
                  <SelectValue placeholder="Column" />
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={values.status ?? 'todo'}
                onValueChange={(v) => set('status', v as TaskStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
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
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={values.priority ?? 'medium'}
            onValueChange={(v) => set('priority', v as TaskPriority)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
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
          value={values.dueDate}
          onChange={(d) => set('dueDate', d)}
          placeholder="Pick due date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="assigneeId">
          Assignee{' '}
          <span className="text-xs font-normal text-muted-foreground">
            (optional, must be project member)
          </span>
        </Label>
        <Select
          value={values.assigneeId ?? 'none'}
          onValueChange={(v) => set('assigneeId', v === 'none' ? '' : v)}
        >
          <SelectTrigger id="assigneeId">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {members.map((m) => {
              const emp = m.employee;
              const name = emp
                ? `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim()
                : 'Unknown';
              return (
                <SelectItem key={m.id} value={m.employeeId}>
                  {name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {apiError ? (
        <p className="text-sm text-destructive" role="alert">
          {apiError}
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {mode === 'create' ? 'Create' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
