import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import {
  EmploymentType,
  LeaveType,
  NotificationType,
  Role,
  Status,
} from '@org/shared-types';
import { Employee } from './entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { Position } from '../position/entities/position.entity';
import { LeaveBalance } from '../leave-balance/entities/leave-balance.entity';
import { Task } from '../task/entities/task.entity';
import { NewEmployeeDto } from './dto/new-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { NotificationService } from '../notification/notification.service';
import { InviteService } from '../invite/invite.service';
import { EmailService } from '../email/email.service';
import { RefreshToken } from '../auth/entities/refreshToken.entity';

const PASSWORD_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
const PASSWORD_LENGTH = 10;

function generateShortPassword(): string {
  let result = '';
  for (let i = 0; i < PASSWORD_LENGTH; i++) {
    result += PASSWORD_CHARS[randomInt(0, PASSWORD_CHARS.length)];
  }
  return result;
}

/** JSON may send email as string; Excel-derived payloads sometimes use numbers. */
function coerceEmailString(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return String(raw).trim();
  }
  return String(raw).trim();
}

/** Strip BOM / zero-width chars Excel sometimes embeds in cell text. */
function sanitizeEmailString(raw: unknown): string {
  let s = coerceEmailString(raw);
  if (!s) return '';
  s = s.replace(/^\uFEFF/, '').replace(/\u200B/g, '').trim();
  return s;
}

/**
 * Nest `plainToInstance` / DTO instances can expose `email` only via `instanceToPlain`
 * or alternate keys; `d.email` is undefined in some cases even though the value validated.
 */
function pickEmailFromEmployeePayload(d: unknown): string {
  if (d == null || typeof d !== 'object') return '';
  const o = d as Record<string, unknown>;
  let raw: unknown =
    o.email ??
    o.Email ??
    o['E-mail'] ??
    o['Email address'] ??
    o['email address'];
  if (raw == null || raw === '') {
    try {
      const plain = instanceToPlain(d as object) as Record<string, unknown>;
      raw = plain.email ?? plain.Email;
    } catch {
      /* ignore */
    }
  }
  if (raw == null || raw === '') {
    try {
      const json = JSON.parse(JSON.stringify(d)) as Record<string, unknown>;
      raw = json.email ?? json.Email;
    } catch {
      /* ignore */
    }
  }
  return sanitizeEmailString(raw);
}

function firstValidationErrorMessage(errs: ValidationError[]): string {
  const e = errs[0];
  if (!e) return 'Validation failed';
  if (e.constraints && Object.keys(e.constraints).length > 0) {
    return Object.values(e.constraints)[0];
  }
  if (e.children?.length) {
    return firstValidationErrorMessage(e.children);
  }
  return e.property ? `${e.property} is invalid` : 'Validation failed';
}

const DEFAULT_LEAVE_DAYS: Record<LeaveType, number> = {
  [LeaveType.VACATION]: 20,
  [LeaveType.SICK]: 10,
  [LeaveType.PERSONAL]: 5,
  [LeaveType.OTHER]: 0,
  [LeaveType.ANNUAL]: 20,
  [LeaveType.UNPAID]: 0,
  [LeaveType.MATERNITY]: 84,
  [LeaveType.PATERNITY]: 10,
};

const EMPLOYEE_LEAVE_TYPES: LeaveType[] = [
  LeaveType.ANNUAL,
  LeaveType.SICK,
  LeaveType.UNPAID,
  LeaveType.MATERNITY,
  LeaveType.PATERNITY,
];

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly notificationService: NotificationService,
    private readonly inviteService: InviteService,
    private readonly emailService: EmailService,
  ) {}

  async createEmployee(
    organizationId: string,
    dto: NewEmployeeDto
  ): Promise<{ employee: Employee }> {
    await this.validateDepartmentPositionForOrg(organizationId, dto);

    const password = generateShortPassword();
    const hashedPassword = await hash(password, 10);

    return await this.dataSource
      .transaction(async (manager) => {
        const employee = await this.createEmployeeCore(
          manager,
          organizationId,
          dto,
          hashedPassword
        );
        return { employee };
      })
      .then(async (result) => {
        await this.sendPostEmployeeCreateNotifications(
          organizationId,
          dto,
          result.employee
        );
        return result;
      });
  }

  async bulkCreateEmployees(
    organizationId: string,
    rows: unknown[]
  ): Promise<{ employees: Employee[] }> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('At least one employee is required');
    }

    const dtos = rows.map((row, i) => {
      if (row == null || typeof row !== 'object') {
        throw new BadRequestException(
          `Employee at index ${i + 1} must be an object`,
        );
      }
      const d = plainToInstance(NewEmployeeDto, row);
      const errs = validateSync(d, {
        whitelist: true,
        forbidUnknownValues: false,
      });
      if (errs.length > 0) {
        throw new BadRequestException(
          `Employee at index ${i + 1}: ${firstValidationErrorMessage(errs)}`,
        );
      }
      return d;
    });

    const trimmedEmails = dtos.map((d, i) => {
      const email =
        sanitizeEmailString(d.email) ||
        pickEmailFromEmployeePayload(d);
      if (!email) {
        throw new BadRequestException(
          `Employee at index ${i + 1} must include a valid email address`,
        );
      }
      Object.assign(d as NewEmployeeDto, { email });
      return email;
    });
    const seen = new Set<string>();
    for (const e of trimmedEmails) {
      const key = e.toLowerCase();
      if (seen.has(key)) {
        throw new BadRequestException(
          'Bulk import contains duplicate email addresses'
        );
      }
      seen.add(key);
    }

    const existingUsers = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(TRIM(u.email)) IN (:...emails)', {
        emails: trimmedEmails.map((x) => x.toLowerCase()),
      })
      .getMany();
    if (existingUsers.length > 0) {
      throw new BadRequestException(
        'One or more email addresses already belong to existing users'
      );
    }

    for (const dto of dtos) {
      await this.validateDepartmentPositionForOrg(organizationId, dto);
    }

    const employees = await this.dataSource.transaction(async (manager) => {
      const result: Employee[] = [];
      for (const dto of dtos) {
        const pwd = generateShortPassword();
        const hashed = await hash(pwd, 10);
        const emp = await this.createEmployeeCore(
          manager,
          organizationId,
          dto,
          hashed
        );
        result.push(emp);
      }
      return result;
    });

    for (let i = 0; i < employees.length; i++) {
      await this.sendPostEmployeeCreateNotifications(
        organizationId,
        dtos[i],
        employees[i]
      );
    }

    return { employees };
  }

  private async validateDepartmentPositionForOrg(
    organizationId: string,
    dto: NewEmployeeDto
  ): Promise<void> {
    const department = await this.departmentRepository.findOne({
      where: { id: dto.departmentId, organization: { id: organizationId } },
      relations: ['organization'],
    });
    if (!department || department.organization?.id !== organizationId) {
      throw new BadRequestException('Department not found');
    }

    const position = await this.positionRepository.findOne({
      where: { id: dto.positionId },
      relations: ['department', 'department.organization'],
    });
    if (!position || position.department?.id !== dto.departmentId) {
      throw new BadRequestException(
        'Position not found or does not belong to the selected department'
      );
    }
    if (position.department?.organization?.id !== organizationId) {
      throw new BadRequestException('Department not found');
    }

    if (dto.managerId) {
      const managerEmp = await this.employeeRepository.findOne({
        where: { id: dto.managerId, organizationId },
      });
      if (!managerEmp) {
        throw new BadRequestException('Manager not found');
      }
    }
  }

  private async createEmployeeCore(
    manager: EntityManager,
    organizationId: string,
    dto: NewEmployeeDto,
    hashedPassword: string
  ): Promise<Employee> {
    const userRepo = manager.getRepository(User);
    const employeeRepo = manager.getRepository(Employee);
    const leaveBalanceRepo = manager.getRepository(LeaveBalance);

    const email =
      pickEmailFromEmployeePayload(dto) || sanitizeEmailString(dto.email);
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const existingUser = await userRepo
      .createQueryBuilder('u')
      .where('LOWER(TRIM(u.email)) = LOWER(:email)', { email })
      .getOne();
    if (existingUser) {
      throw new BadRequestException(
        'A user with this email already exists. Use a different email for the new employee, or that person should sign in with their existing account — no invite email is sent in this case.'
      );
    }

    const newUser = userRepo.create({
      email,
      password: hashedPassword,
      role: dto.role ?? Role.EMPLOYEE,
      isActive: true,
      organizationId,
    });
    const savedUser = await userRepo.save(newUser);

    const newEmployee = employeeRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      avatar: dto.avatar,
      dateOfBirth:
        dto.dateOfBirth != null ? new Date(dto.dateOfBirth) : undefined,
      hireDate: dto.hireDate != null ? new Date(dto.hireDate) : undefined,
      employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
      managerId: dto.managerId,
      positionId: dto.positionId,
      departmentId: dto.departmentId,
      userId: savedUser.id,
      organizationId,
    });
    const savedEmployee = await employeeRepo.save(newEmployee);

    const currentYear = new Date().getFullYear().toString();
    const leaveBalances = EMPLOYEE_LEAVE_TYPES.map((leaveType) => {
      const total = DEFAULT_LEAVE_DAYS[leaveType];
      return leaveBalanceRepo.create({
        type: leaveType,
        year: currentYear,
        used: 0,
        remaining: total,
        total,
        employeeId: savedEmployee.id,
      });
    });
    await leaveBalanceRepo.save(leaveBalances);

    return savedEmployee;
  }

  private async sendPostEmployeeCreateNotifications(
    organizationId: string,
    dto: NewEmployeeDto,
    employee: Employee
  ): Promise<void> {
    try {
      const admins = await this.userRepository.find({
        where: {
          organizationId,
          role: In([Role.ADMIN, Role.SUPER_ADMIN]),
        },
      });
      for (const admin of admins) {
        await this.notificationService.create({
          userId: admin.id,
          organizationId,
          type: NotificationType.EMPLOYEE_CREATED,
          title: 'New employee joined',
          message: `${employee.firstName} ${employee.lastName} has joined the organization`,
          link: `/employees/${employee.id}`,
        });
      }
    } catch {
      // Notification failures must not break the main operation
    }
    try {
      const inviteEmail =
        pickEmailFromEmployeePayload(dto) || sanitizeEmailString(dto.email);
      if (!inviteEmail) {
        this.logger.warn(
          `Welcome invite skipped: no email on DTO for employee ${employee.id}`
        );
        return;
      }
      const { token } = await this.inviteService.createToken(employee.userId);
      await this.emailService.sendWelcomeInvite(
        inviteEmail,
        dto.firstName ?? '',
        token
      );
    } catch (err) {
      this.logger.warn(
        `Welcome invite email not sent for ${dto.email ?? '(no email)'}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async updateEmployee(id: string, organizationId: string, dto: UpdateEmployeeDto): Promise<Employee> {
    return await this.dataSource.transaction(async (manager) => {
      const employeeRepo = manager.getRepository(Employee);
      const userRepo = manager.getRepository(User);

      const employee = await employeeRepo.findOne({
        where: { id, organizationId },
        relations: ['user'],
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const { email, role, dateOfBirth, hireDate, ...employeeFields } = dto;
      const updates = Object.fromEntries(
        Object.entries(employeeFields).filter(([, v]) => v !== undefined)
      ) as Partial<Employee>;
      Object.assign(employee, updates);
      if (dateOfBirth != null) employee.dateOfBirth = new Date(dateOfBirth);
      if (hireDate != null) employee.hireDate = new Date(hireDate);

      if (email != null || role != null) {
        const user = employee.user;
        if (email != null) {
          const existingUser = await userRepo.findOne({
            where: { email },
          });
          if (existingUser && existingUser.id !== user.id) {
            throw new BadRequestException('User with this email already exists');
          }
          user.email = email;
        }
        if (role != null) user.role = role;
        await userRepo.save(user);
      }

      return await employeeRepo.save(employee);
    });
  }

  async deactivateEmployee(
    id: string,
    organizationId: string,
    actingUserId: string
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (employee.userId === actingUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }
    if (!employee.user.isActive && employee.status === Status.INACTIVE) {
      return this.getEmployee(id, organizationId);
    }

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const employeeRepo = manager.getRepository(Employee);
      const rtRepo = manager.getRepository(RefreshToken);

      const user = await userRepo.findOne({ where: { id: employee.userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.isActive = false;
      await userRepo.save(user);

      employee.status = Status.INACTIVE;
      await employeeRepo.save(employee);

      await rtRepo.delete({ userId: employee.userId });
    });

    return this.getEmployee(id, organizationId);
  }

  async activateEmployee(id: string, organizationId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (employee.user.isActive && employee.status === Status.ACTIVE) {
      return this.getEmployee(id, organizationId);
    }

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const employeeRepo = manager.getRepository(Employee);

      const user = await userRepo.findOne({ where: { id: employee.userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.isActive = true;
      await userRepo.save(user);

      employee.status = Status.ACTIVE;
      await employeeRepo.save(employee);
    });

    return this.getEmployee(id, organizationId);
  }

  async deleteEmployee(id: string, organizationId: string): Promise<void> {
    const employee = await this.employeeRepository.findOne({
      where: { id, organizationId },
      relations: ['user'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Employee).softDelete(id);
      await manager.getRepository(User).softDelete(employee.user.id);
    });
  }

  private stripUserPassword(employee: Employee): Employee {
    if (employee.user && 'password' in employee.user) {
      delete (employee.user as { password?: string }).password;
    }
    return employee;
  }

  async getEmployee(id: string, organizationId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, organizationId },
      relations: ['user', 'department', 'position', 'manager'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return this.stripUserPassword(employee);
  }

  async getEmployees(organizationId: string): Promise<Employee[]> {
    const employees = await this.employeeRepository.find({
      where: { organizationId },
      relations: ['user', 'department', 'position'],
    });
    return employees.map((e) => this.stripUserPassword(e));
  }

  async getTasksByEmployeeId(
    employeeId: string,
    organizationId: string
  ): Promise<Task[]> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return this.taskRepository.find({
      where: { assigneeId: employeeId, organizationId },
      relations: ['assignee', 'assignee.user', 'kanbanColumn', 'project'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }
}
