// LeaveRequestForm.tsx
// Form for creating a new leave request, used in a Sheet.
// Admin/manager: selects employee to assign leave to.
// Employee: leave is auto-assigned to themselves.

import { useEffect, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { DatePicker } from '~/components/ui/date-picker';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '~/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import type { ApiEmployee } from '~/services/employee.service';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
] as const;

const baseSchema = z.object({
  type: z.enum(['annual', 'sick', 'unpaid', 'maternity', 'paternity'], {
    required_error: 'Required',
  }),
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
  reason: z.string().optional(),
});

const schema = baseSchema.refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return new Date(data.endDate) >= new Date(data.startDate);
  },
  { message: 'End date must be on or after start date', path: ['endDate'] }
);

type FormValues = z.infer<typeof schema>;

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return differenceInDays(end, start) + 1;
}

function formatEmployeeLabel(emp: ApiEmployee): string {
  const name = `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim();
  const email = emp.user?.email ?? '';
  return email ? `${name} (${email})` : name || 'Unknown';
}

export interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: FormValues & { employeeId: string }) => Promise<void>;
  onUpdate?: (id: string, values: FormValues) => Promise<void>;
  /** Current user's employee (for employees; leave is auto-assigned) */
  employeeId: string | null;
  /** Employees list (for admin/manager; they select who to assign leave to) */
  employees: ApiEmployee[];
  /** When true, show employee selector; when false, use employeeId */
  isAdmin: boolean;
  /** When set, form is in edit mode with these initial values */
  initialRequest?: { id: string; type: string; startDate: string; endDate: string; reason?: string | null; employeeId?: string };
  isSubmitting?: boolean;
  error?: string | null;
}

export function LeaveRequestForm({
  open,
  onSubmit,
  onUpdate,
  employeeId,
  employees,
  isAdmin,
  initialRequest,
  isSubmitting = false,
  error: formError,
}: LeaveRequestFormProps) {
  const isEdit = !!initialRequest;

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues | 'employeeId', string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const error = formError ?? submitError;

  useEffect(() => {
    if (open) {
      if (initialRequest) {
        setSelectedEmployeeId(initialRequest.employeeId ?? '');
        setType(initialRequest.type ?? '');
        setStartDate(initialRequest.startDate ?? undefined);
        setEndDate(initialRequest.endDate ?? undefined);
        setReason(initialRequest.reason ?? '');
      } else {
        setSelectedEmployeeId('');
        setType('');
        setStartDate(undefined);
        setEndDate(undefined);
        setReason('');
      }
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [open, initialRequest]);

  const resolvedEmployeeId = isAdmin ? selectedEmployeeId : employeeId;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    if (!isEdit && !resolvedEmployeeId) {
      if (isAdmin) {
        setFieldErrors({ employeeId: 'Select an employee' });
      } else {
        setSubmitError('Complete your employee profile before submitting a leave request.');
      }
      return;
    }

    const result = schema.safeParse({
      type: type || undefined,
      startDate: startDate ?? '',
      endDate: endDate ?? '',
      reason: reason || undefined,
    });

    if (!result.success) {
      const errs: Partial<Record<keyof FormValues, string>> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof FormValues;
        if (path) errs[path] = err.message;
      });
      setFieldErrors(errs);
      return;
    }

    try {
      if (isEdit && initialRequest && onUpdate) {
        await onUpdate(initialRequest.id, result.data);
      } else {
        await onSubmit({
          ...result.data,
          employeeId: resolvedEmployeeId,
        });
      }
    } catch (e) {
      setSubmitError(
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : 'Failed to submit'
      );
    }
  }

  if (!isEdit && !isAdmin && !employeeId) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Complete your employee profile before submitting a leave request.
        </p>
      </div>
    );
  }

  if (!isEdit && isAdmin && employees.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-muted-foreground">
          No employees available. Add employees first to assign leave.
        </p>
      </div>
    );
  }

  const startDateObj = startDate ? new Date(startDate) : undefined;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <div
          className="rounded-lg border border-destructive/25 bg-destructive-muted px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <FieldGroup>
        {isAdmin && !isEdit ? (
          <Field>
            <FieldLabel>Employee</FieldLabel>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {formatEmployeeLabel(emp)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.employeeId}</FieldError>
          </Field>
        ) : null}

        <Field>
          <FieldLabel>Type</FieldLabel>
          <Select value={type} onValueChange={setType} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {LEAVE_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.type}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Start date</FieldLabel>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            fromDate={new Date()}
            placeholder="Pick start date"
          />
          <FieldError>{fieldErrors.startDate}</FieldError>
        </Field>

        <Field>
          <FieldLabel>End date</FieldLabel>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            fromDate={startDateObj ?? new Date()}
            placeholder="Pick end date"
          />
          <FieldError>{fieldErrors.endDate}</FieldError>
        </Field>

        {startDate && endDate ? (
          <p className="text-sm text-muted-foreground">
            Duration: {calculateDays(startDate, endDate)} day(s)
          </p>
        ) : null}

        <Field>
          <FieldLabel>Reason (optional)</FieldLabel>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for leave"
            rows={3}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isEdit ? 'Saving…' : 'Submitting…') : isEdit ? 'Save' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}
