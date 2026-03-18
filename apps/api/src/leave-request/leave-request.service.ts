import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { NewLeaveRequestDto } from './dto/new-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestStatus } from '@org/shared-types';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>
  ) {}

  async create(dto: NewLeaveRequestDto): Promise<LeaveRequest> {
    const { employeeId, ...rest } = dto;
    const request = this.leaveRequestRepository.create({
      ...rest,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      employee: { id: employeeId },
    });
    return await this.leaveRequestRepository.save(request);
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
    request.status = LeaveRequestStatus.APPROVED;
    request.approvedById = approvedById;
    return await this.leaveRequestRepository.save(request);
  }

  async reject(id: string, approvedById: string): Promise<LeaveRequest> {
    const request = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['employee', 'approvedBy'],
    });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }
    request.status = LeaveRequestStatus.REJECTED;
    request.approvedById = approvedById;
    return await this.leaveRequestRepository.save(request);
  }

  async update(
    id: string,
    dto: UpdateLeaveRequestDto
  ): Promise<UpdateResult> {
    const { approvedById, ...rest } = dto;
    const payload: Partial<LeaveRequest> = {
      ...rest,
      startDate: dto.startDate != null ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate != null ? new Date(dto.endDate) : undefined,
      approvedById: approvedById ?? undefined,
    };
    const result = await this.leaveRequestRepository.update(id, payload);
    if (result.affected === 0) {
      throw new NotFoundException('Leave request not found');
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const result = await this.leaveRequestRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Leave request not found');
    }
  }
}
