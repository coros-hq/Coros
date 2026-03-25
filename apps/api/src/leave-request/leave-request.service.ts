import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

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
      return this.leaveRequestRepository.find({
        where: { employee: { organizationId } },
        relations: ['employee', 'employee.user', 'approvedBy'],
      });
    }

    return this.leaveRequestRepository.find({
      where: { employee: { userId, organizationId } },
      relations: ['employee', 'employee.user', 'approvedBy'],
    });
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

    const request = this.leaveRequestRepository.create({
      ...rest,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
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
      relations: ['employee', 'employee.user', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    request.status = LeaveRequestStatus.APPROVED;
    request.approvedById = approvedById;
    const saved = await this.leaveRequestRepository.save(request);

    try {
      if (request.employee?.userId) {
        await this.notificationService.create({
          userId: request.employee.userId,
          organizationId: request.employee.organizationId,
          type: NotificationType.LEAVE_REQUEST_APPROVED,
          title: 'Leave request approved',
          message: `Your ${request.type} leave request has been approved`,
          link: '/leave-requests',
        });
      }
    } catch {
      // Notification failures must not break the main operation
    }

    return saved;
  }

  async reject(id: string, approvedById: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'employee.user', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    request.status = LeaveRequestStatus.REJECTED;
    request.approvedById = approvedById;
    const saved = await this.leaveRequestRepository.save(request);

    try {
      if (request.employee?.userId) {
        await this.notificationService.create({
          userId: request.employee.userId,
          organizationId: request.employee.organizationId,
          type: NotificationType.LEAVE_REQUEST_REJECTED,
          title: 'Leave request rejected',
          message: `Your ${request.type} leave request has been rejected`,
          link: '/leave-requests',
        });
      }
    } catch {
      // Notification failures must not break the main operation
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
    if (dto.type != null) request.type = dto.type as LeaveRequest['type'];
    if (dto.startDate != null) request.startDate = new Date(dto.startDate);
    if (dto.endDate != null) request.endDate = new Date(dto.endDate);
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
