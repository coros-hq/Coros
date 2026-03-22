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
import { DEPARTMENT_COLORS } from '~/constants/department-colors';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiEmployee } from '~/services/employee.service';

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  color: z.string().min(1, 'Required'),
  managerId: z.string().optional(),
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

export interface DepartmentFormProps {
  mode: 'create' | 'edit';
  department?: ApiDepartment;
  employees: ApiEmployee[];
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

export function DepartmentForm({
  mode,
  department,
  employees,
  onSubmit,
  onCancel,
}: DepartmentFormProps) {
  const [values, setValues] = useState<FormValues>(() => {
    if (mode === 'edit' && department) {
      return {
        name: department.name,
        color: department.color ?? DEPARTMENT_COLORS[0].value,
        managerId: department.manager?.id ?? 'none',
      };
    }
    return {
      name: '',
      color: DEPARTMENT_COLORS[0].value,
      managerId: 'none',
    };
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set(field: keyof FormValues, value: string) {
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
          placeholder="Engineering"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <FieldError message={errors.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Color</Label>
        <Select
          value={values.color}
          onValueChange={(val) => set('color', val ?? DEPARTMENT_COLORS[0].value)}
        >
          <SelectTrigger id="color">
            <SelectValue placeholder="Select color" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENT_COLORS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: c.value }}
                  />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.color} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="managerId">
          Manager{' '}
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Select
          value={values.managerId ?? 'none'}
          onValueChange={(val) => set('managerId', val ?? 'none')}
        >
          <SelectTrigger id="managerId">
            <SelectValue placeholder="No manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No manager</SelectItem>
            {employees.map((emp) => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </SelectItem>
            ))}
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
