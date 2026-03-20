import { useState } from 'react';
import { redirect, useNavigate } from 'react-router';
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
import { applySessionFromAccessToken, tryRefreshSession } from '~/lib/api';
import { setupService } from '~/services/setup.service';

export async function clientLoader() {
  const session = await tryRefreshSession();
  if (!session) throw redirect('/login');

  applySessionFromAccessToken(session.accessToken);

  const { setupRequired } = await setupService.getSetupStatus();
  if (!setupRequired) throw redirect('/');

  return null;
}

const DEPARTMENT_COLORS = [
  { value: '#6366f1', label: 'Violet' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
] as const;

const step1Schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  departmentName: z.string().min(1, 'Required'),
  departmentColor: z.string().optional(),
  positionTitle: z.string().min(1, 'Required'),
});

const step2Schema = z.object({
  phone: z.string().min(1, 'Required'),
  dateOfBirth: z.string().min(1, 'Required'),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type FieldErrors<T> = Partial<Record<keyof T, string>>;

function CorosIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" opacity={0.95} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="10" opacity={0.85} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="6" opacity={0.75} stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" fill="currentColor" opacity={0.9} r="2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg aria-hidden className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
    </svg>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function Step1({ onNext }: { onNext: (data: Step1Data) => void }) {
  const [values, setValues] = useState<Step1Data>({
    firstName: '',
    lastName: '',
    departmentName: '',
    departmentColor: DEPARTMENT_COLORS[0].value,
    positionTitle: '',
  });
  const [errors, setErrors] = useState<FieldErrors<Step1Data>>({});

  function set(field: keyof Step1Data, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const result = step1Schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors<Step1Data> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Step1Data;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onNext(result.data);
  }

  return (
    <form onSubmit={handleContinue} noValidate>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Set up your workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add your name, then create your first department and position.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="firstName">
              First name
            </Label>
            <Input
              className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
              id="firstName"
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="Jane"
              value={values.firstName}
            />
            <FieldError message={errors.firstName} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="lastName">
              Last name
            </Label>
            <Input
              className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
              id="lastName"
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="Smith"
              value={values.lastName}
            />
            <FieldError message={errors.lastName} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="departmentName">
            Department name
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="departmentName"
            onChange={(e) => set('departmentName', e.target.value)}
            placeholder="Engineering"
            value={values.departmentName}
          />
          <FieldError message={errors.departmentName} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="departmentColor">
            Department color
          </Label>
          <Select
            onValueChange={(val) => set('departmentColor', val ?? DEPARTMENT_COLORS[0].value)}
            value={values.departmentColor ?? DEPARTMENT_COLORS[0].value}
          >
            <SelectTrigger className="h-10 w-full border-border bg-background text-foreground" id="departmentColor">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENT_COLORS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.value }} />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="positionTitle">
            Position / job title
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="positionTitle"
            onChange={(e) => set('positionTitle', e.target.value)}
            placeholder="CEO"
            value={values.positionTitle}
          />
          <FieldError message={errors.positionTitle} />
        </div>
      </div>

      <Button className="mt-6 h-10 w-full bg-primary font-medium text-white hover:bg-primary/90" type="submit">
        Continue →
      </Button>
    </form>
  );
}

function Step2({ step1Data }: { step1Data: Step1Data }) {
  const navigate = useNavigate();
  const [values, setValues] = useState<Step2Data>({
    phone: '',
    dateOfBirth: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [errors, setErrors] = useState<FieldErrors<Step2Data>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function set(field: keyof Step2Data, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const result = step2Schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors<Step2Data> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Step2Data;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await setupService.setup({
        ...step1Data,
        departmentColor: step1Data.departmentColor,
        phone: result.data.phone,
        dateOfBirth: result.data.dateOfBirth,
        address: result.data.address || undefined,
        emergencyContactName: result.data.emergencyContactName || undefined,
        emergencyContactPhone: result.data.emergencyContactPhone || undefined,
      });
      navigate('/');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : null;
      setApiError(message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleFinish} noValidate>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Complete your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">This information will appear on your employee record.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="phone">
            Phone number
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="phone"
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+1 555 000 0000"
            value={values.phone}
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="dateOfBirth">
            Date of birth
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="dateOfBirth"
            onChange={(e) => set('dateOfBirth', e.target.value)}
            type="date"
            value={values.dateOfBirth}
          />
          <FieldError message={errors.dateOfBirth} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground" htmlFor="address">
            Address
            <span className="ml-1 text-xs normal-case tracking-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="address"
            onChange={(e) => set('address', e.target.value)}
            placeholder="123 Main St, City, Country"
            value={values.address}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            htmlFor="emergencyContactName"
          >
            Emergency contact name
            <span className="ml-1 text-xs normal-case tracking-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="emergencyContactName"
            onChange={(e) => set('emergencyContactName', e.target.value)}
            placeholder="John Smith"
            value={values.emergencyContactName}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground"
            htmlFor="emergencyContactPhone"
          >
            Emergency contact phone
            <span className="ml-1 text-xs normal-case tracking-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            className="h-10 border-border bg-background text-foreground placeholder:text-muted-foreground"
            id="emergencyContactPhone"
            onChange={(e) => set('emergencyContactPhone', e.target.value)}
            placeholder="+1 555 000 0001"
            value={values.emergencyContactPhone}
          />
        </div>
      </div>

      {apiError ? <p className="mt-4 text-sm text-destructive">{apiError}</p> : null}

      <Button
        className="mt-6 h-10 w-full bg-primary font-medium text-white hover:bg-primary/90 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Spinner />
            Setting up…
          </span>
        ) : (
          'Finish setup'
        )}
      </Button>
    </form>
  );
}

export default function SetupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);

  function handleStep1Next(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-accent px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <CorosIcon className="h-6 w-6" />
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 2</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-8 shadow-sm">
          {step === 1 ? (
            <Step1 onNext={handleStep1Next} />
          ) : (
            <Step2 step1Data={step1Data!} />
          )}
        </div>
      </div>
    </div>
  );
}
