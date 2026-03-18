import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { LeaveBalance } from './entities/leave-balance.entity';
import { NewLeaveBalanceDto } from './dto/new-leave-balance.dto';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';

@Injectable()
export class LeaveBalanceService {
  constructor(
    @InjectRepository(LeaveBalance)
    private readonly leaveBalanceRepository: Repository<LeaveBalance>
  ) {}

  async create(dto: NewLeaveBalanceDto): Promise<LeaveBalance> {
    const { employeeId, ...rest } = dto;
    const balance = this.leaveBalanceRepository.create({
      ...rest,
      employee: { id: employeeId },
    });
    return await this.leaveBalanceRepository.save(balance);
  }

  async findOne(id: string): Promise<LeaveBalance> {
    const balance = await this.leaveBalanceRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!balance) {
      throw new NotFoundException('Leave balance not found');
    }
    return balance;
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveBalance[]> {
    return await this.leaveBalanceRepository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee'],
    });
  }

  async findByEmployeeAndYear(
    employeeId: string,
    year: string
  ): Promise<LeaveBalance[]> {
    return await this.leaveBalanceRepository.find({
      where: { employee: { id: employeeId }, year },
      relations: ['employee'],
    });
  }

  async update(
    id: string,
    dto: UpdateLeaveBalanceDto
  ): Promise<UpdateResult> {
    const result = await this.leaveBalanceRepository.update(id, dto);
    if (result.affected === 0) {
      throw new NotFoundException('Leave balance not found');
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const result = await this.leaveBalanceRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Leave balance not found');
    }
  }
}
