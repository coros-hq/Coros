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
import type { ApiContract } from '~/services/contract.service';

const CONTRACT_TYPES: { value: string; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'intern', label: 'Intern' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'MAD', 'CAD', 'AED'] as const;

const formSchema = z
  .object({
    type: z.enum(['full_time', 'part_time', 'contractor', 'intern']),
    startDate: z.string().min(1, 'Required'),
    endDate: z.string().optional(),
    salary: z.number().positive().optional(),
    currency: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.endDate) return;
    const start = new Date(`${data.startDate}T00:00:00`);
    const end = new Date(`${data.endDate}T00:00:00`);
    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate'],
      });
    }
  });

export type ContractFormValues = z.infer<typeof formSchema>;

type FieldErrors = Partial<Record<keyof ContractFormValues, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function toIsoDateOnly(s: string): string {
  if (!s) return s;
  return s.slice(0, 10);
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

export interface ContractFormProps {
  /** Create or edit — omit employeeId; parent adds it on create. */
  onSubmit: (values: ContractFormValues) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<ApiContract>;
}

export function ContractForm({
  onSubmit,
  onCancel,
  defaultValues,
}: ContractFormProps) {
  const [values, setValues] = useState<ContractFormValues>(() => ({
    type: (defaultValues?.type as ContractFormValues['type']) ?? 'full_time',
    startDate: defaultValues?.startDate
      ? toIsoDateOnly(defaultValues.startDate)
      : '',
    endDate: defaultValues?.endDate
      ? toIsoDateOnly(defaultValues.endDate)
      : undefined,
    salary:
      defaultValues?.salary != null && !Number.isNaN(defaultValues.salary)
        ? defaultValues.salary
        : undefined,
    currency: defaultValues?.currency ?? 'USD',
    notes: defaultValues?.notes ?? '',
  }));

  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const startDateForEnd = values.startDate
    ? new Date(`${values.startDate}T00:00:00`)
    : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    const payload = {
      ...values,
      salary:
        values.salary === undefined || Number.isNaN(values.salary)
          ? undefined
          : values.salary,
      notes: values.notes?.trim() || undefined,
      endDate: values.endDate?.trim() || undefined,
    };

    const parsed = formSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContractFormValues;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setApiError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {apiError ? (
        <p className="text-sm text-destructive">{apiError}</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="contract-type">Type</Label>
        <Select
          value={values.type}
          onValueChange={(v) =>
            setValues((v0) => ({
              ...v0,
              type: v as ContractFormValues['type'],
            }))
          }
        >
          <SelectTrigger id="contract-type" className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {CONTRACT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.type} />
      </div>

      <div className="space-y-2">
        <Label>Start date</Label>
        <DatePicker
          value={values.startDate}
          onChange={(next) =>
            setValues((v0) => ({ ...v0, startDate: next ?? '' }))
          }
          placeholder="Pick start date"
        />
        <FieldError message={errors.startDate} />
      </div>

      <div className="space-y-2">
        <Label>End date</Label>
        <p className="text-xs text-muted-foreground">
          Leave empty for permanent contract
        </p>
        <DatePicker
          value={values.endDate}
          onChange={(next) =>
            setValues((v0) => ({ ...v0, endDate: next }))
          }
          fromDate={startDateForEnd}
          placeholder="Pick end date (optional)"
        />
        <FieldError message={errors.endDate} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contract-salary">Salary (monthly)</Label>
        <Input
          id="contract-salary"
          type="number"
          min={0}
          step={100}
          placeholder="Optional"
          value={values.salary === undefined ? '' : String(values.salary)}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') {
              setValues((v0) => ({ ...v0, salary: undefined }));
              return;
            }
            const n = Number(raw);
            setValues((v0) => ({ ...v0, salary: Number.isNaN(n) ? undefined : n }));
          }}
        />
        <FieldError message={errors.salary} />
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>
        <Select
          value={values.currency ?? 'USD'}
          onValueChange={(v) =>
            setValues((v0) => ({ ...v0, currency: v }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.currency} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contract-notes">Notes</Label>
        <Textarea
          id="contract-notes"
          rows={3}
          placeholder="Optional"
          value={values.notes ?? ''}
          onChange={(e) =>
            setValues((v0) => ({ ...v0, notes: e.target.value }))
          }
        />
        <FieldError message={errors.notes} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
