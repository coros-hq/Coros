import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { Contract } from './entities/contract.entity';
import { Employee } from '../employee/entities/employee.entity';
import { NewContractDto } from './dto/new-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>
  ) {}

  async createContract(dto: NewContractDto): Promise<Contract> {
    const { employeeId, ...rest } = dto;
    const contract = this.contractRepository.create({
      ...rest,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      employee: { id: employeeId },
    });
    const saved = await this.contractRepository.save(contract);
    await this.employeeRepository.update(employeeId, { contractId: saved.id });
    return saved;
  }

  async findOne(id: string): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async findByEmployeeId(employeeId: string): Promise<Contract | null> {
    return await this.contractRepository.findOne({
      where: { employee: { id: employeeId } },
      relations: ['employee'],
    });
  }

  async updateContract(id: string, dto: UpdateContractDto): Promise<UpdateResult> {
    const payload: Partial<Contract> = {
      ...dto,
      startDate: dto.startDate != null ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate != null ? new Date(dto.endDate) : undefined,
    };
    const result = await this.contractRepository.update(id, payload);
    if (result.affected === 0) {
      throw new NotFoundException('Contract not found');
    }
    return result;
  }

  async deleteContract(id: string): Promise<void> {
    const result = await this.contractRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Contract not found');
    }
  }
}
