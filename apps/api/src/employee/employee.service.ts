import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import { EmploymentType, LeaveType, NotificationType, Role } from '@org/shared-types';

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
import { Employee } from './entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { LeaveBalance } from '../leave-balance/entities/leave-balance.entity';
import { Task } from '../task/entities/task.entity';
import { NewEmployeeDto } from './dto/new-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { NotificationService } from '../notification/notification.service';
import { InviteService } from '../invite/invite.service';
import { EmailService } from '../email/email.service';

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
    const department = await this.departmentRepository.findOne({
        where: { id: dto.departmentId , organization: {id: organizationId}},
        relations: ['organization'],
      });
      if (!department) {
        throw new BadRequestException('Department not found');
      }
      if (department.organization?.id !== organizationId) {
        throw new BadRequestException('Department not found');
      }

    const password = generateShortPassword();
    const hashedPassword = await hash(password, 10);

    return await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const employeeRepo = manager.getRepository(Employee);
      const leaveBalanceRepo = manager.getRepository(LeaveBalance);

      const existingUser = await userRepo.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new BadRequestException(
          'A user with this email already exists. Use a different email for the new employee, or that person should sign in with their existing account — no invite email is sent in this case.',
        );
      }

      const newUser = userRepo.create({
        email: dto.email,
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
        dateOfBirth: dto.dateOfBirth != null ? new Date(dto.dateOfBirth) : undefined,
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

      return { employee: savedEmployee };
    }).then(async (result) => {
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
            message: `${result.employee.firstName} ${result.employee.lastName} has joined the organization`,
            link: `/employees/${result.employee.id}`,
          });
        }
      } catch {
        // Notification failures must not break the main operation
      }
      try {
        const { token } = await this.inviteService.createToken(
          result.employee.userId,
        );
        await this.emailService.sendWelcomeInvite(
          dto.email,
          dto.firstName,
          token,
        );
      } catch (err) {
        this.logger.warn(
          `Welcome invite email not sent for ${dto.email}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return result;
    });
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
