import { useState } from 'react';
import { redirect, useNavigate } from 'react-router';
import { z } from 'zod';
import { ArrowRight, Loader2, Target } from 'lucide-react';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { DEPARTMENT_COLORS } from '~/constants/department-colors';
import { applySessionFromAccessToken, tryRefreshSession } from '~/lib/api';
import { setupService } from '~/services/setup.service';
import { DatePicker } from '~/components/ui/date-picker';

export async function clientLoader() {
  const session = await tryRefreshSession();
  if (!session) throw redirect('/login');
  applySessionFromAccessToken(session.accessToken);
  const { setupRequired } = await setupService.getSetupStatus();
  if (!setupRequired) throw redirect('/');
  return null;
}

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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
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
        fieldErrors[issue.path[0] as keyof Step1Data] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onNext(result.data);
  }

  return (
    <form onSubmit={handleContinue} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            placeholder="Jane"
            value={values.firstName}
            onChange={(e) => set('firstName', e.target.value)}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            placeholder="Smith"
            value={values.lastName}
            onChange={(e) => set('lastName', e.target.value)}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="departmentName">Department name</Label>
        <Input
          id="departmentName"
          placeholder="Engineering"
          value={values.departmentName}
          onChange={(e) => set('departmentName', e.target.value)}
        />
        <FieldError message={errors.departmentName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="departmentColor">Department color</Label>
        <Select
          value={values.departmentColor ?? DEPARTMENT_COLORS[0].value}
          onValueChange={(val) => set('departmentColor', val ?? DEPARTMENT_COLORS[0].value)}
        >
          <SelectTrigger id="departmentColor">
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="positionTitle">Position / job title</Label>
        <Input
          id="positionTitle"
          placeholder="CEO"
          value={values.positionTitle}
          onChange={(e) => set('positionTitle', e.target.value)}
        />
        <FieldError message={errors.positionTitle} />
      </div>

      <Button type="submit" className="w-full">
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
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
        fieldErrors[issue.path[0] as keyof Step2Data] = issue.message;
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
    <form onSubmit={handleFinish} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          placeholder="+1 555 000 0000"
          value={values.phone}
          onChange={(e) => set('phone', e.target.value)}
        />
        <FieldError message={errors.phone} />
      </div>

      <div className="space-y-2">
  <Label>Date of birth</Label>
  <DatePicker
    value={values.dateOfBirth}
    onChange={(next) => set('dateOfBirth', next ?? '')}
    placeholder="Select date of birth"
    toDate={new Date()}
  />
  <FieldError message={errors.dateOfBirth} />
</div>

      <div className="space-y-2">
        <Label htmlFor="address">
          Address{' '}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="address"
          placeholder="123 Main St, City, Country"
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContactName">
          Emergency contact name{' '}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="emergencyContactName"
          placeholder="John Smith"
          value={values.emergencyContactName}
          onChange={(e) => set('emergencyContactName', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContactPhone">
          Emergency contact phone{' '}
          <span className="text-xs font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="emergencyContactPhone"
          placeholder="+1 555 000 0001"
          value={values.emergencyContactPhone}
          onChange={(e) => set('emergencyContactPhone', e.target.value)}
        />
      </div>

      {apiError ? (
        <p className="text-sm text-destructive">{apiError}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up…
          </>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Step {step} of 2</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Set up your workspace' : 'Complete your profile'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Add your name, then create your first department and position.'
                : 'This information will appear on your employee record.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <Step1 onNext={handleStep1Next} />
            ) : (
              <Step2 step1Data={step1Data!} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}