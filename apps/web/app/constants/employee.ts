/** Values assignable to an employee's app role (org user role). */
export enum EmployeeUserRole {
  Employee = 'employee',
  Manager = 'manager',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

export const EMPLOYEE_USER_ROLE_LABELS: Record<EmployeeUserRole, string> = {
  [EmployeeUserRole.Employee]: 'Employee',
  [EmployeeUserRole.Manager]: 'Manager',
  [EmployeeUserRole.Admin]: 'Admin',
  [EmployeeUserRole.SuperAdmin]: 'Super admin',
};

export enum EmploymentType {
  FullTime = 'full_time',
  PartTime = 'part_time',
  Contract = 'contract',
  Intern = 'intern',
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  [EmploymentType.FullTime]: 'Full-time',
  [EmploymentType.PartTime]: 'Part-time',
  [EmploymentType.Contract]: 'Contract',
  [EmploymentType.Intern]: 'Intern',
};
