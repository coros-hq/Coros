import { useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
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
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiProject, ProjectStatus } from '~/services/project.service';
import { DatePicker } from '~/components/ui/date-picker';

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

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

export interface ProjectFormProps {
  mode: 'create' | 'edit';
  project?: ApiProject;
  employees: ApiEmployee[];
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({
  mode,
  project,
  employees,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [values, setValues] = useState<FormValues>(() => {
    if (mode === 'edit' && project) {
      return {
        name: project.name,
        description: project.description ?? '',
        status: project.status,
        startDate: project.startDate ?? undefined,
        endDate: project.endDate ?? undefined,
        memberIds: [], // Edit mode doesn't support memberIds in form per spec
      };
    }
    return {
      name: '',
      description: '',
      status: 'planning',
      startDate: undefined,
      endDate: undefined,
      memberIds: [],
    };
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    if (apiError) setApiError(null);
  }

  function toggleMember(employeeId: string) {
    const current = values.memberIds ?? [];
    const next = current.includes(employeeId)
      ? current.filter((id) => id !== employeeId)
      : [...current, employeeId];
    set('memberIds', next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    const result = formSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof FormValues;
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="Engineering initiative"
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
          placeholder="Brief description of the project..."
          value={values.description ?? ''}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={values.status ?? 'planning'}
          onValueChange={(v) => set('status', v as ProjectStatus)}
        >
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start date</Label>
          <DatePicker
            value={values.startDate}
            onChange={(d) => set('startDate', d)}
            placeholder="Pick start date"
          />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <DatePicker
            value={values.endDate}
            onChange={(d) => set('endDate', d)}
            placeholder="Pick end date"
          />
        </div>
      </div>

      {mode === 'create' && employees.length > 0 ? (
        <div className="space-y-2">
          <Label>
            Initial members{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <div className="max-h-32 overflow-y-auto rounded-md border border-input p-3">
            <div className="space-y-2">
              {employees.map((emp) => {
                const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
                const label = emp.user?.email ? `${name} (${emp.user.email})` : name || 'Unknown';
                const isChecked = (values.memberIds ?? []).includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`member-${emp.id}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleMember(emp.id)}
                    />
                    <label
                      htmlFor={`member-${emp.id}`}
                      className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

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
