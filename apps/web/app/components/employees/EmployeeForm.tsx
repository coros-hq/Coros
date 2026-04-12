// EmployeeForm.tsx
// Create/edit employee form used in a Sheet

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { CreatableSelect } from '~/components/ui/creatable-select';
import { DatePicker as ShadcnDatePicker } from '~/components/ui/date-picker';
import type { ApiEmployee } from '~/services/employee.service';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiPosition } from '~/services/position.service';
import { useAuthStore } from '~/stores/auth.store';
import {
  EmployeeUserRole,
  EmploymentType,
  EMPLOYEE_USER_ROLE_LABELS,
  EMPLOYMENT_TYPE_LABELS,
} from '~/constants/employee';

const createSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Required'),
  avatar: z.string().optional(),
  dateOfBirth: z.string().optional(),
  hireDate: z.string().optional(),
  departmentId: z.string().min(1, 'Required'),
  positionId: z.string().min(1, 'Required'),
  managerId: z.string().optional(),
  role: z.nativeEnum(EmployeeUserRole).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
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
  /** When set, department is fixed and the department field is hidden. */
  fixedDepartmentId?: string;
  createDepartment?: (
    name: string,
    color?: string
  ) => Promise<ApiDepartment>;
  createPosition?: (
    departmentId: string,
    name: string,
    description?: string
  ) => Promise<ApiPosition>;
  onSubmit: (values: CreateValues | UpdateValues) => Promise<void>;
  onCancel: () => void;
}

export function EmployeeForm({
  mode,
  employee,
  departments,
  positions,
  employees,
  fixedDepartmentId,
  createDepartment,
  createPosition,
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
        avatar: employee.avatar ?? '',
        dateOfBirth: toDateInputValue(employee.dateOfBirth),
        hireDate: toDateInputValue(employee.hireDate),
        departmentId: employee.department?.id ?? fixedDepartmentId ?? '',
        positionId: employee.position?.id ?? '',
        managerId: employee.managerId ?? '',
        role:
          (employee.user?.role as EmployeeUserRole | undefined) ??
          EmployeeUserRole.Employee,
        employmentType: EmploymentType.FullTime,
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: '',
      dateOfBirth: '',
      hireDate: '',
      departmentId: fixedDepartmentId ?? '',
      positionId: '',
      managerId: '',
      role: EmployeeUserRole.Employee,
      employmentType: EmploymentType.FullTime,
    };
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveDepartmentId = fixedDepartmentId ?? values.departmentId;
  const filteredPositions = positions.filter(
    (p) => !effectiveDepartmentId || p.department?.id === effectiveDepartmentId
  );

  const managerOptions = employees.filter((e) => e.id !== employee?.id);
  const initials = `${values.firstName ?? ''} ${values.lastName ?? ''}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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

  const user = useAuthStore((s) => s.user);
  const isAdmin =
    user?.role === EmployeeUserRole.Admin ||
    user?.role === EmployeeUserRole.SuperAdmin;

  const getEmploymentLabel = (value: string) =>
    EMPLOYMENT_TYPE_LABELS[value as EmploymentType] ?? value;
  const getRoleLabel = (value: string) =>
    EMPLOYEE_USER_ROLE_LABELS[value as EmployeeUserRole] ?? value;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 py-4 "
      noValidate
    >
      {errors._form ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors._form}
        </div>
      ) : null}

      {/* First name / Last name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
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
          <Label htmlFor="lastName">Last name</Label>
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

      {/* Avatar */}
      <div className="space-y-2">
        <Label htmlFor="avatar">Photo</Label>
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border">
            {values.avatar ? (
              <AvatarImage
                alt="Employee photo"
                src={String(values.avatar)}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback className="text-xs font-semibold">
              {initials || '—'}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  set('avatar', '');
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result;
                  set('avatar', typeof result === 'string' ? result : '');
                };
                reader.readAsDataURL(file);
              }}
            />
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Upload an image (stored with the employee record).
              </p>
              {values.avatar ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => set('avatar', '')}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="phone">Phone</Label>
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
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <ShadcnDatePicker
            value={values.dateOfBirth}
            onChange={(next) => set('dateOfBirth', next ?? '')}
            placeholder="Select date of birth"
          />
          <FieldError message={errors.dateOfBirth} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hireDate">Hire date</Label>
          <ShadcnDatePicker
            value={values.hireDate}
            onChange={(next) => set('hireDate', next ?? '')}
            placeholder="Select hire date"
          />
          <FieldError message={errors.hireDate} />
        </div>
      </div>

      {/* Department - hidden when fixed */}
      {!fixedDepartmentId ? (
        <div className="space-y-2">
          <Label>Department</Label>
          <CreatableSelect
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            value={values.departmentId ?? ''}
            onChange={(v) => set('departmentId', v)}
            placeholder="Select department"
            disabled={!isAdmin && mode === 'edit'}
            onCreate={
              createDepartment
                ? async (name, color) => {
                    const d = await createDepartment(name, color);
                    return { value: d.id, label: d.name };
                  }
                : undefined
            }
            showColorPicker={true}
            createLabel="department"
          />
          <FieldError message={errors.departmentId} />
        </div>
      ) : null}

      {/* Position */}
      <div className="space-y-2">
        <Label>Position</Label>
        <CreatableSelect
          options={filteredPositions.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
          value={values.positionId ?? ''}
          onChange={(v) => set('positionId', v)}
          placeholder="Select position"
          disabled={
            (!isAdmin && mode === 'edit') || !effectiveDepartmentId
          }
          onCreate={
            createPosition && effectiveDepartmentId
              ? async (name) => {
                  const deptId = effectiveDepartmentId;
                  if (!deptId) return null;
                  const p = await createPosition(deptId, name);
                  return { value: p.id, label: p.name };
                }
              : undefined
          }
          showColorPicker={false}
          createLabel="position"
        />
        <FieldError message={errors.positionId} />
      </div>

      {/* Manager */}
      <div className="space-y-2">
        <Label>
          Manager{' '}
          <span className="normal-case tracking-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Select
          value={values.managerId ?? 'none'}
          onValueChange={(v) => set('managerId', v === 'none' ? undefined : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
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
            value={values.employmentType ?? EmploymentType.FullTime}
            onValueChange={(v) =>
              set('employmentType', v as CreateValues['employmentType'])
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type">
                {values.employmentType
                  ? getEmploymentLabel(String(values.employmentType))
                  : ''}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(
                Object.values(EmploymentType) as EmploymentType[]
              ).map((type) => (
                <SelectItem key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Role */}
      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={values.role ?? EmployeeUserRole.Employee}
          onValueChange={(v) => set('role', v as CreateValues['role'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role">
              {values.role
                ? getRoleLabel(String(values.role))
                : EMPLOYEE_USER_ROLE_LABELS[EmployeeUserRole.Employee]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.values(EmployeeUserRole) as EmployeeUserRole[]).map(
              (r) => (
                <SelectItem key={r} value={r}>
                  {EMPLOYEE_USER_ROLE_LABELS[r]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <FieldError message={errors.role} />
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 pb-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving…'
            : mode === 'create'
            ? 'Create employee'
            : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
