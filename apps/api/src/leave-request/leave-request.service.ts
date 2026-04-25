import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { NewLeaveRequestDto } from './dto/new-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestStatus, NotificationType, Role } from '@org/shared-types';
import { NotificationService } from '../notification/notification.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class LeaveRequestService {
  private readonly logger = new Logger(LeaveRequestService.name);

  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  private formatLeaveDate(value: Date | string): string {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toDateString();
  }

  private assertValidDateRange(startDate: Date, endDate: Date): void {
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid leave request dates');
    }
    if (endDate < startDate) {
      throw new BadRequestException(
        'End date must be on or after start date',
      );
    }
  }

  /** Loads only non-sensitive user columns for transactional email. */
  private async resolveLeaveRecipient(
    userId: string,
    employeeFirstName: string,
  ): Promise<{ email: string; firstName: string } | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'firstName'],
    });
    if (!user) {
      return null;
    }
    const email = user.email?.trim();
    if (!email) {
      return null;
    }
    return {
      email,
      firstName: (employeeFirstName || user.firstName || 'there').trim(),
    };
  }

  private async loadEmployeeNotifyTarget(employeeId: string): Promise<{
    userId: string;
    organizationId: string;
    firstName: string;
  } | null> {
    const emp = await this.employeeRepository.findOne({
      where: { id: employeeId },
      select: ['userId', 'organizationId', 'firstName'],
    });
    if (!emp?.userId) {
      return null;
    }
    return {
      userId: emp.userId,
      organizationId: emp.organizationId,
      firstName: emp.firstName ?? '',
    };
  }

  /** Attach `{ email }` only — never load full `User` on `employee` (avoids password in API payloads). */
  private async attachEmployeeUserEmailOnly(
    requests: LeaveRequest[],
  ): Promise<void> {
    const userIds = [
      ...new Set(
        requests
          .map((r) => r.employee?.userId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (userIds.length === 0) {
      return;
    }
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      select: ['id', 'email'],
    });
    const emailByUserId = new Map(users.map((u) => [u.id, u.email]));
    for (const r of requests) {
      const uid = r.employee?.userId;
      if (!r.employee || !uid) continue;
      const email = emailByUserId.get(uid)?.trim();
      Object.assign(r.employee, {
        user: email ? { email } : undefined,
      });
    }
  }

  async findAllForUser(
    userId: string,
    organizationId: string,
    role: Role,
  ): Promise<LeaveRequest[]> {
    const isAdminOrManager =
      role === Role.SUPER_ADMIN ||
      role === Role.ADMIN ||
      role === Role.MANAGER;

    if (isAdminOrManager) {
      const rows = await this.leaveRequestRepository.find({
        where: { employee: { organizationId } },
        relations: ['employee', 'approvedBy'],
      });
      await this.attachEmployeeUserEmailOnly(rows);
      return rows;
    }

    const rows = await this.leaveRequestRepository.find({
      where: { employee: { userId, organizationId } },
      relations: ['employee', 'approvedBy'],
    });
    await this.attachEmployeeUserEmailOnly(rows);
    return rows;
  }

  async cancel(id: string, userId: string, organizationId: string): Promise<LeaveRequest> {
    const employee = await this.employeeRepository.findOne({
      where: { userId, organizationId },
    });
    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }

    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    if (request.employeeId !== employee.id) {
      throw new ForbiddenException('Can only cancel your own leave requests');
    }
    if (request.status !== LeaveRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }

    request.status = LeaveRequestStatus.CANCELLED;
    return this.leaveRequestRepository.save(request);
  }

  async create(
    dto: NewLeaveRequestDto,
    userId: string,
    role: Role,
  ): Promise<LeaveRequest> {
    const { employeeId, ...rest } = dto;
    const isAdminOrManager =
      role === Role.SUPER_ADMIN ||
      role === Role.ADMIN ||
      role === Role.MANAGER;

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.assertValidDateRange(startDate, endDate);

    const request = this.leaveRequestRepository.create({
      ...rest,
      startDate,
      endDate,
      employee: { id: employeeId },
      status: isAdminOrManager ? LeaveRequestStatus.APPROVED : LeaveRequestStatus.PENDING,
      approvedById: isAdminOrManager ? userId : null,
    });
    const saved = await this.leaveRequestRepository.save(request);

    if (!isAdminOrManager) {
      try {
        const employee = await this.employeeRepository.findOne({
          where: { id: employeeId },
        });
        if (employee) {
          const admins = await this.userRepository.find({
            where: {
              organizationId: employee.organizationId,
              role: In([Role.ADMIN, Role.MANAGER, Role.SUPER_ADMIN]),
            },
          });
          for (const admin of admins) {
            await this.notificationService.create({
              userId: admin.id,
              organizationId: employee.organizationId,
              type: NotificationType.LEAVE_REQUEST_SUBMITTED,
              title: 'New leave request',
              message: `${employee.firstName} ${employee.lastName} submitted a ${dto.type} leave request`,
              link: '/leave-requests',
            });
          }
        }
      } catch {
        // Notification failures must not break the main operation
      }
    }

    return saved;
  }

  async findOne(id: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    return request;
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee', 'approvedBy'],
    });
  }

  async findByStatus(status: LeaveRequestStatus): Promise<LeaveRequest[]> {
    return await this.leaveRequestRepository.find({
      where: { status },
      relations: ['employee', 'approvedBy'],
    });
  }

  async approve(id: string, approvedById: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    const notifyFromLoaded =
      request.employee?.userId && request.employee.organizationId
        ? {
            userId: request.employee.userId,
            organizationId: request.employee.organizationId,
            firstName: request.employee.firstName ?? '',
          }
        : null;

    request.status = LeaveRequestStatus.APPROVED;
    request.approvedById = approvedById;
    const saved = await this.leaveRequestRepository.save(request);

    // `save()` can drop populated relations on `request`; do not rely on `request.employee` after this point.
    const notify =
      notifyFromLoaded ??
      (await this.loadEmployeeNotifyTarget(request.employeeId));

    if (!notify) {
      this.logger.warn(
        `Leave approved: missing employee notify target for request ${id} (employeeId ${request.employeeId})`,
      );
      return saved;
    }

    try {
      await this.notificationService.create({
        userId: notify.userId,
        organizationId: notify.organizationId,
        type: NotificationType.LEAVE_REQUEST_APPROVED,
        title: 'Leave request approved',
        message: `Your ${request.type} leave request has been approved`,
        link: '/leave-requests',
      });
    } catch (err) {
      this.logger.warn(
        `Leave approved notification failed for user ${notify.userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    try {
      console.log(`Attempting leave email for userId: ${notify.userId}`);
      
      const recipient = await this.resolveLeaveRecipient(
        notify.userId,
        notify.firstName,
      );
      
      console.log(`Recipient resolved: ${JSON.stringify(recipient)}`);
      
      if (!recipient) {
        this.logger.warn(
          `Leave approved email skipped: no email for user ${notify.userId}`,
        );
      } else {
        await this.emailService.sendLeaveStatusUpdate(
          recipient.email,
          recipient.firstName || 'there',
          request.type,
          this.formatLeaveDate(request.startDate),
          this.formatLeaveDate(request.endDate),
          'approved',
        );
        console.log(`Leave approved email sent to ${recipient.email}`);
      }
    } catch (err) {
      console.error(
        `Leave approved email failed for user ${notify.userId}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }

    return saved;
  }

  async reject(id: string, approvedById: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    const notifyFromLoaded =
      request.employee?.userId && request.employee.organizationId
        ? {
            userId: request.employee.userId,
            organizationId: request.employee.organizationId,
            firstName: request.employee.firstName ?? '',
          }
        : null;

    request.status = LeaveRequestStatus.REJECTED;
    request.approvedById = approvedById;
    const saved = await this.leaveRequestRepository.save(request);

    const notify =
      notifyFromLoaded ??
      (await this.loadEmployeeNotifyTarget(request.employeeId));

    if (!notify) {
      this.logger.warn(
        `Leave rejected: missing employee notify target for request ${id} (employeeId ${request.employeeId})`,
      );
      return saved;
    }

    try {
      await this.notificationService.create({
        userId: notify.userId,
        organizationId: notify.organizationId,
        type: NotificationType.LEAVE_REQUEST_REJECTED,
        title: 'Leave request rejected',
        message: `Your ${request.type} leave request has been rejected`,
        link: '/leave-requests',
      });
    } catch (err) {
      this.logger.warn(
        `Leave rejected notification failed for user ${notify.userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    try {
      const recipient = await this.resolveLeaveRecipient(
        notify.userId,
        notify.firstName,
      );
      if (!recipient) {
        this.logger.warn(
          `Leave rejected email skipped: no email for user ${notify.userId}`,
        );
      } else {
        await this.emailService.sendLeaveStatusUpdate(
          recipient.email,
          recipient.firstName || 'there',
          request.type,
          this.formatLeaveDate(request.startDate),
          this.formatLeaveDate(request.endDate),
          'rejected',
          request.reason ?? undefined,
        );
      }
    } catch (err) {
      this.logger.error(
        `Leave rejected email failed for user ${notify.userId}: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }

    return saved;
  }

  async update(
    id: string,
    dto: UpdateLeaveRequestDto
  ): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    const nextStartDate =
      dto.startDate != null ? new Date(dto.startDate) : request.startDate;
    const nextEndDate =
      dto.endDate != null ? new Date(dto.endDate) : request.endDate;
    this.assertValidDateRange(nextStartDate, nextEndDate);

    if (dto.type != null) request.type = dto.type as LeaveRequest['type'];
    if (dto.startDate != null) request.startDate = nextStartDate;
    if (dto.endDate != null) request.endDate = nextEndDate;
    if (dto.reason !== undefined) request.reason = dto.reason ?? null;
    if (dto.status != null) request.status = dto.status;
    if (dto.approvedById !== undefined)
      request.approvedById = dto.approvedById ?? null;
    return this.leaveRequestRepository.save(request);
  }

  async updateForUser(
    id: string,
    dto: UpdateLeaveRequestDto,
    userId: string,
    organizationId: string,
    role: Role,
  ): Promise<LeaveRequest> {
    const isAdminOrManager =
      role === Role.SUPER_ADMIN ||
      role === Role.ADMIN ||
      role === Role.MANAGER;

    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (isAdminOrManager) {
      return this.update(id, dto);
    }

    const employee = await this.employeeRepository.findOne({
      where: { userId, organizationId },
    });
    if (!employee) {
      throw new ForbiddenException('Employee profile not found');
    }
    if (request.employeeId !== employee.id) {
      throw new ForbiddenException('Can only edit your own leave requests');
    }
    if (
      request.status !== LeaveRequestStatus.PENDING &&
      request.status !== LeaveRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only pending or approved requests can be edited',
      );
    }

    const employeeDto: UpdateLeaveRequestDto = {
      type: dto.type,
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
    };
    return this.update(id, employeeDto);
  }

  async delete(id: string): Promise<void> {
    const result = await this.leaveRequestRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Leave request not found');
    }
  }
}
