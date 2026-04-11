import * as XLSX from 'xlsx';

export const EMPLOYEE_IMPORT_HEADERS = [
  'First name',
  'Last name',
  'Email',
  'Phone',
  'Department',
  'Position',
  'Hire date',
  'Date of birth',
  'Employment type',
  'Role',
  'Manager email',
] as const;

export function downloadEmployeeImportTemplate(): void {
  const example = [
    'Ada',
    'Lovelace',
    'ada@company.com',
    '+1234567890',
    'Engineering',
    'Software Engineer',
    '',
    '',
    'full_time',
    'employee',
    '',
  ];
  const ws = XLSX.utils.aoa_to_sheet([
    [...EMPLOYEE_IMPORT_HEADERS],
    example,
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');
  XLSX.writeFile(wb, 'employees_import_template.xlsx');
}
