import * as XLSX from 'xlsx';
import type { ApiEmployee, CreateEmployeePayload } from '~/services/employee.service';
import type { ApiDepartment } from '~/services/department.service';
import type { ApiPosition } from '~/services/position.service';

const FIELD_BY_HEADER = new Map<string, keyof RowFields>([
  ['first name', 'firstName'],
  ['first_name', 'firstName'],
  ['last name', 'lastName'],
  ['last_name', 'lastName'],
  ['email', 'email'],
  ['e-mail', 'email'],
  ['phone', 'phone'],
  ['department', 'department'],
  ['position', 'position'],
  ['job title', 'position'],
  ['hire date', 'hireDate'],
  ['hire_date', 'hireDate'],
  ['date of birth', 'dateOfBirth'],
  ['date_of_birth', 'dateOfBirth'],
  ['dob', 'dateOfBirth'],
  ['employment type', 'employmentType'],
  ['employment_type', 'employmentType'],
  ['role', 'role'],
  ['manager email', 'managerEmail'],
  ['manager_email', 'managerEmail'],
]);

interface RowFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: string;
  dateOfBirth: string;
  employmentType: string;
  role: string;
  managerEmail: string;
}

function normalizeHeaderKey(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapHeaderToField(header: string): keyof RowFields | undefined {
  return FIELD_BY_HEADER.get(normalizeHeaderKey(header));
}

function cellToIsoDate(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    const { y, m, d } = parsed;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return undefined;
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return undefined;
}

function stringCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return cellToIsoDate(value) ?? '';
  let s = String(value).trim();
  if (s.startsWith('\ufeff')) s = s.slice(1);
  s = s.replace(/\u200b/g, '').trim();
  return s;
}

const EMPLOYMENT_TYPES = new Set([
  'full_time',
  'part_time',
  'contract',
  'intern',
]);

const EMPLOYMENT_ALIASES: Record<string, CreateEmployeePayload['employmentType']> =
  {
    'full-time': 'full_time',
    'full time': 'full_time',
    'part-time': 'part_time',
    'part time': 'part_time',
  };

function parseEmploymentType(
  raw: string
): CreateEmployeePayload['employmentType'] | undefined {
  const t = raw.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (!t) return undefined;
  if (EMPLOYMENT_TYPES.has(t)) {
    return t as CreateEmployeePayload['employmentType'];
  }
  // API enum is `contract`; Excel often uses "contractor".
  if (t === 'contractor') {
    return 'contract';
  }
  const alias = EMPLOYMENT_ALIASES[raw.trim().toLowerCase()];
  return alias;
}

const ROLES = new Set(['admin', 'manager', 'employee']);

function parseRole(raw: string): CreateEmployeePayload['role'] | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (ROLES.has(t)) return t as CreateEmployeePayload['role'];
  return undefined;
}

function findDepartmentByName(
  departments: ApiDepartment[],
  name: string
): { ok: true; id: string } | { ok: false; message: string } {
  const q = name.trim().toLowerCase();
  const matches = departments.filter(
    (d) => d.name.trim().toLowerCase() === q
  );
  if (matches.length === 0) {
    return { ok: false, message: `Unknown department: "${name}"` };
  }
  if (matches.length > 1) {
    return { ok: false, message: `Ambiguous department name: "${name}"` };
  }
  return { ok: true, id: matches[0].id };
}

function findPositionInDepartment(
  positions: ApiPosition[],
  departmentId: string,
  name: string
): { ok: true; id: string } | { ok: false; message: string } {
  const q = name.trim().toLowerCase();
  const matches = positions.filter(
    (p) =>
      p.department?.id === departmentId && p.name.trim().toLowerCase() === q
  );
  if (matches.length === 0) {
    return {
      ok: false,
      message: `Unknown position "${name}" for this department`,
    };
  }
  if (matches.length > 1) {
    return { ok: false, message: `Ambiguous position: "${name}"` };
  }
  return { ok: true, id: matches[0].id };
}

function errorMessageFromUnknown(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message: unknown }).message;
    if (typeof m === 'string' && m) return m;
  }
  return 'Request failed';
}

function findManagerByEmail(
  employees: ApiEmployee[],
  email: string
): { ok: true; id: string } | { ok: false; message: string } {
  const q = email.trim().toLowerCase();
  for (const e of employees) {
    const em = e.user?.email?.trim().toLowerCase();
    if (em === q) return { ok: true, id: e.id };
  }
  return { ok: false, message: `No employee with manager email: ${email}` };
}

function isRowEmpty(fields: RowFields): boolean {
  return (
    !fields.firstName &&
    !fields.lastName &&
    !fields.email &&
    !fields.phone &&
    !fields.department &&
    !fields.position
  );
}

function emptyRowFields(): RowFields {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    dateOfBirth: '',
    employmentType: '',
    role: '',
    managerEmail: '',
  };
}

export type ParseEmployeeImportResult =
  | { ok: true; payloads: CreateEmployeePayload[] }
  | { ok: false; errors: { row: number; message: string }[] };

export type ParseEmployeeImportContext = {
  departments: ApiDepartment[];
  positions: ApiPosition[];
  employees: ApiEmployee[];
  /** When set, missing departments are created via the API before resolving rows. */
  createDepartmentIfMissing?: (name: string) => Promise<ApiDepartment>;
  /** When set, missing positions under the resolved department are created. */
  createPositionIfMissing?: (
    departmentId: string,
    name: string
  ) => Promise<ApiPosition>;
};

export async function parseEmployeeImportFile(
  file: File,
  ctx: ParseEmployeeImportContext
): Promise<ParseEmployeeImportResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { ok: false, errors: [{ row: 0, message: 'Workbook has no sheets' }] };
  }
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null | undefined)[]>(
    sheet,
    { header: 1, defval: '', raw: true }
  );
  if (!matrix.length) {
    return { ok: false, errors: [{ row: 1, message: 'Sheet is empty' }] };
  }

  const headerRow = matrix[0].map((c) => String(c ?? '').trim());
  const columnToField: (keyof RowFields | undefined)[] = headerRow.map((h) =>
    h ? mapHeaderToField(h) : undefined
  );

  let workingDepartments = [...ctx.departments];
  let workingPositions = [...ctx.positions];
  const deptCreateInFlight = new Map<string, Promise<ApiDepartment>>();
  const posCreateInFlight = new Map<string, Promise<ApiPosition>>();

  async function resolveDepartment(
    rawName: string
  ): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
    const name = rawName.trim();
    const found = findDepartmentByName(workingDepartments, name);
    if (found.ok) return { ok: true, id: found.id };
    if (!ctx.createDepartmentIfMissing) {
      return { ok: false, message: found.message };
    }
    const key = name.toLowerCase();
    let p = deptCreateInFlight.get(key);
    if (!p) {
      p = ctx
        .createDepartmentIfMissing(name)
        .then((d) => {
          workingDepartments = [...workingDepartments, d];
          return d;
        })
        .catch((err: unknown) => {
          deptCreateInFlight.delete(key);
          throw err;
        });
      deptCreateInFlight.set(key, p);
    }
    try {
      const d = await p;
      return { ok: true, id: d.id };
    } catch (e: unknown) {
      return { ok: false, message: errorMessageFromUnknown(e) };
    }
  }

  async function resolvePosition(
    departmentId: string,
    rawTitle: string
  ): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
    const title = rawTitle.trim();
    const found = findPositionInDepartment(
      workingPositions,
      departmentId,
      title
    );
    if (found.ok) return { ok: true, id: found.id };
    if (!ctx.createPositionIfMissing) {
      return { ok: false, message: found.message };
    }
    const key = `${departmentId}|${title.toLowerCase()}`;
    let p = posCreateInFlight.get(key);
    if (!p) {
      p = ctx
        .createPositionIfMissing(departmentId, title)
        .then((pos) => {
          workingPositions = [...workingPositions, pos];
          return pos;
        })
        .catch((err: unknown) => {
          posCreateInFlight.delete(key);
          throw err;
        });
      posCreateInFlight.set(key, p);
    }
    try {
      const pos = await p;
      return { ok: true, id: pos.id };
    } catch (e: unknown) {
      return { ok: false, message: errorMessageFromUnknown(e) };
    }
  }

  const errors: { row: number; message: string }[] = [];
  const payloads: CreateEmployeePayload[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const excelRow = r + 1;
    const rowArray = matrix[r] ?? [];
    const fields = emptyRowFields();
    for (let c = 0; c < columnToField.length; c++) {
      const field = columnToField[c];
      if (!field) continue;
      const raw = rowArray?.[c];
      if (
        field === 'hireDate' ||
        field === 'dateOfBirth'
      ) {
        const iso = cellToIsoDate(raw);
        fields[field] = iso ?? '';
      } else {
        fields[field] = stringCell(raw);
      }
    }

    if (isRowEmpty(fields)) continue;

    if (!fields.firstName) {
      errors.push({ row: excelRow, message: 'First name is required' });
      continue;
    }
    if (!fields.lastName) {
      errors.push({ row: excelRow, message: 'Last name is required' });
      continue;
    }
    if (!fields.email) {
      errors.push({ row: excelRow, message: 'Email is required' });
      continue;
    }
    if (!fields.phone) {
      errors.push({ row: excelRow, message: 'Phone is required' });
      continue;
    }
    if (!fields.department) {
      errors.push({ row: excelRow, message: 'Department is required' });
      continue;
    }
    if (!fields.position) {
      errors.push({ row: excelRow, message: 'Position is required' });
      continue;
    }

    const dept = await resolveDepartment(fields.department);
    if (!dept.ok) {
      errors.push({ row: excelRow, message: dept.message });
      continue;
    }

    const pos = await resolvePosition(dept.id, fields.position);
    if (!pos.ok) {
      errors.push({ row: excelRow, message: pos.message });
      continue;
    }

    let managerId: string | undefined;
    if (fields.managerEmail.trim()) {
      const mgr = findManagerByEmail(ctx.employees, fields.managerEmail);
      if (mgr.ok) {
        managerId = mgr.id;
      }
      // Manager is optional: if the email is not an existing employee yet
      // (e.g. same import batch or typo), import without a manager assignment.
    }

    let employmentType: CreateEmployeePayload['employmentType'] | undefined;
    if (fields.employmentType.trim()) {
      const et = parseEmploymentType(fields.employmentType);
      if (!et) {
        errors.push({
          row: excelRow,
          message: `Invalid employment type: "${fields.employmentType}"`,
        });
        continue;
      }
      employmentType = et;
    }

    let role: CreateEmployeePayload['role'] | undefined;
    if (fields.role.trim()) {
      const rl = parseRole(fields.role);
      if (!rl) {
        errors.push({
          row: excelRow,
          message: `Invalid role: "${fields.role}"`,
        });
        continue;
      }
      role = rl;
    }

    const payload: CreateEmployeePayload = {
      firstName: fields.firstName.trim(),
      lastName: fields.lastName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      departmentId: dept.id,
      positionId: pos.id,
    };
    if (fields.hireDate.trim()) {
      payload.hireDate = fields.hireDate.trim();
    }
    if (fields.dateOfBirth.trim()) {
      payload.dateOfBirth = fields.dateOfBirth.trim();
    }
    if (employmentType) payload.employmentType = employmentType;
    if (role) payload.role = role;
    if (managerId) payload.managerId = managerId;

    payloads.push(payload);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }
  if (payloads.length === 0) {
    return {
      ok: false,
      errors: [{ row: 0, message: 'No data rows found (only empty rows)' }],
    };
  }

  return { ok: true, payloads };
}
