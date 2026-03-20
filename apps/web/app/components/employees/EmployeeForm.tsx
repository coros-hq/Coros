// EmployeeForm.tsx
// Create/edit employee form used in a Sheet

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
import { DatePicker as ShadcnDatePicker } from '~/components/ui/date-picker';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiPosition } from '~/services/position.service';

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  dateOfBirth: z.string().optional(),
  hireDate: z.string().optional(),
  departmentId: z.string().min(1, 'Required'),
  positionId: z.string().min(1, 'Required'),
  managerId: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  employmentType: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
});

const updateSchema = createSchema.partial();

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;
type FieldErrors = Partial<Record<string, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

export interface EmployeeFormProps {
  mode: 'create' | 'edit';
  employee?: ApiEmployee;
  departments: ApiDepartment[];
  positions: ApiPosition[];
  employees: ApiEmployee[];
  onSubmit: (values: CreateValues | UpdateValues) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeForm({
  mode,
  employee,
  departments,
  positions,
  employees,
  onSubmit,
  onCancel,
}: EmployeeFormProps) {
  const toDateInputValue = (v?: string) => {
    if (!v) return '';
    return v.slice(0, 10);
  };

  const [values, setValues] = useState<CreateValues | UpdateValues>(() => {
    if (mode === 'edit' && employee) {
      return {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.user?.email ?? '',
        phone: employee.phone ?? '',
        dateOfBirth: toDateInputValue(employee.dateOfBirth),
        hireDate: toDateInputValue(employee.hireDate),
        departmentId: employee.department?.id ?? '',
        positionId: employee.position?.id ?? '',
        managerId: employee.managerId ?? '',
        role: (employee.user?.role as CreateValues['role']) ?? 'employee',
        employmentType: 'full_time',
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      hireDate: '',
      departmentId: '',
      positionId: '',
      managerId: '',
      role: 'employee',
      employmentType: 'full_time',
    };
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPositions = positions.filter(
    (p) => !values.departmentId || p.department?.id === values.departmentId
  );

  const managerOptions = employees.filter((e) => e.id !== employee?.id);

  function set<K extends keyof (CreateValues | UpdateValues)>(
    field: K,
    value: (CreateValues | UpdateValues)[K]
  ) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field as string]) {
      setErrors((e) => ({ ...e, [field as string]: undefined }));
    }
    if (field === 'departmentId') {
      setValues((v) => ({ ...v, positionId: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const schema = mode === 'create' ? createSchema : updateSchema;
    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    const managerId = result.data.managerId;
    const dateOfBirth = result.data.dateOfBirth;
    const hireDate = result.data.hireDate;
    const role = result.data.role;
    const data = {
      ...result.data,
      managerId: managerId && managerId !== '' ? managerId : undefined,
      dateOfBirth: dateOfBirth && dateOfBirth !== '' ? dateOfBirth : undefined,
      hireDate: hireDate && hireDate !== '' ? hireDate : undefined,
      role: role ? role : undefined,
    };
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onCancel();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Something went wrong';
      setErrors({ _form: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isAdmin = true; // TODO: derive from useAuthStore

  const EMPLOYMENT_LABELS: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    intern: 'Intern',
  };
  const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super admin',
    admin: 'Admin',
    manager: 'Manager',
    employee: 'Employee',
  };

  const getDepartmentLabel = (id: string) => departments.find((d) => d.id === id)?.name ?? '';
  const getPositionLabel = (id: string) =>
    positions.find((p) => p.id === id)?.name ?? '';
  const getManagerLabel = (id: string) => {
    const e = managerOptions.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : '';
  };
  const getEmploymentLabel = (value: string) =>
    EMPLOYMENT_LABELS[value] ?? value;
  const getRoleLabel = (value: string) => ROLE_LABELS[value] ?? value;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-4" noValidate>
      {errors._form ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors._form}
        </div>
      ) : null}

      {/* First name / Last name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First name
          </Label>
          <Input
            id="firstName"
            value={values.firstName ?? ''}
            onChange={(e) => set('firstName', e.target.value)}
            placeholder="Jane"
            disabled={!isAdmin && mode === 'edit'}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last name
          </Label>
          <Input
            id="lastName"
            value={values.lastName ?? ''}
            onChange={(e) => set('lastName', e.target.value)}
            placeholder="Smith"
            disabled={!isAdmin && mode === 'edit'}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={values.email ?? ''}
          onChange={(e) => set('email', e.target.value)}
          placeholder="jane@company.com"
          disabled={mode === 'edit'}
        />
        <FieldError message={errors.email} />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone
        </Label>
        <Input
          id="phone"
          value={values.phone ?? ''}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="+1 234 567 8900"
        />
        <FieldError message={errors.phone} />
      </div>

      {/* Date of birth / Hire date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            Date of birth
          </Label>
          <ShadcnDatePicker
            value={values.dateOfBirth}
            onChange={(next) => set('dateOfBirth', next ?? '')}
            placeholder="Select date of birth"
          />
          <FieldError message={errors.dateOfBirth} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hireDate">
            Hire date
          </Label>
          <ShadcnDatePicker
            value={values.hireDate}
            onChange={(next) => set('hireDate', next ?? '')}
            placeholder="Select hire date"
          />
          <FieldError message={errors.hireDate} />
        </div>
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label>Department</Label>
        <Select
          value={values.departmentId ?? ''}
          onValueChange={(v) => set('departmentId', v ?? '')}
          disabled={!isAdmin && mode === 'edit'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select department">
              {values.departmentId ? getDepartmentLabel(values.departmentId) : ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.departmentId} />
      </div>

      {/* Position */}
      <div className="space-y-2">
        <Label>Position</Label>
        <Select
          value={values.positionId ?? ''}
          onValueChange={(v) => set('positionId', v ?? '')}
          disabled={!isAdmin && mode === 'edit'}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select position">
              {values.positionId ? getPositionLabel(values.positionId) : ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {filteredPositions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError message={errors.positionId} />
      </div>

      {/* Manager */}
      <div className="space-y-2">
        <Label>
          Manager{' '}
          <span className="normal-case tracking-normal text-muted-foreground">(optional)</span>
        </Label>
        <Select
          value={values.managerId ?? ''}
          onValueChange={(v) => set('managerId', !v ? undefined : v)}
          disabled={!isAdmin && mode === 'edit'}
        >
          <SelectTrigger>
            <SelectValue placeholder="None">
              {values.managerId ? getManagerLabel(String(values.managerId)) : ''}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              None
            </SelectItem>
            {managerOptions.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employment type — create only */}
      {mode === 'create' ? (
        <div className="space-y-2">
          <Label>Employment type</Label>
          <Select
            value={values.employmentType ?? 'full_time'}
            onValueChange={(v) => set('employmentType', v as CreateValues['employmentType'])}
          >
            <SelectTrigger>
            <SelectValue placeholder="Select type">
              {values.employmentType
                ? getEmploymentLabel(String(values.employmentType))
                : ''}
            </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">
                Full-time
              </SelectItem>
              <SelectItem value="part_time">
                Part-time
              </SelectItem>
              <SelectItem value="contract">
                Contract
              </SelectItem>
              <SelectItem value="intern">
                Intern
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Role */}
      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={values.role ?? 'employee'}
          onValueChange={(v) => set('role', v as CreateValues['role'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role">
              {values.role ? getRoleLabel(String(values.role)) : 'Employee'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">
              Employee
            </SelectItem>
            <SelectItem value="manager">
              Manager
            </SelectItem>
            <SelectItem value="admin">
              Admin
            </SelectItem>
            <SelectItem value="super_admin">
              Super admin
            </SelectItem>
          </SelectContent>
        </Select>
        <FieldError message={errors.role} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 pb-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create employee' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}