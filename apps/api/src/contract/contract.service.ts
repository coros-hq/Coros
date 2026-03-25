import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@org/shared-types';
import { Contract } from './entities/contract.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Document } from '../document/entities/document.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>
  ) {}

  private async resolveCallerEmployeeId(
    userId: string,
    organizationId: string
  ): Promise<string | null> {
    const emp = await this.employeeRepository.findOne({
      where: { userId, organizationId },
    });
    return emp?.id ?? null;
  }

  private async assertEmployeeInOrg(
    employeeId: string,
    organizationId: string
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  private async assertDocumentInOrg(
    documentId: string,
    organizationId: string
  ): Promise<void> {
    const doc = await this.documentRepository.findOne({
      where: { id: documentId, organizationId },
    });
    if (!doc) {
      throw new BadRequestException('Document not found in this organization');
    }
  }

  async create(
    organizationId: string,
    dto: CreateContractDto
  ): Promise<Contract> {
    await this.assertEmployeeInOrg(dto.employeeId, organizationId);
    if (dto.documentId) {
      await this.assertDocumentInOrg(dto.documentId, organizationId);
    }
    if (dto.endDate && dto.startDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (end < start) {
        throw new BadRequestException('endDate must be on or after startDate');
      }
    }

    const contract = this.contractRepository.create({
      organizationId,
      employeeId: dto.employeeId,
      type: dto.type,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate != null ? new Date(dto.endDate) : null,
      salary: dto.salary ?? null,
      currency: dto.currency ?? 'USD',
      notes: dto.notes ?? null,
      documentId: dto.documentId ?? null,
    });
    const saved = await this.contractRepository.save(contract);
    return this.findOne(organizationId, saved.id, '', Role.ADMIN);
  }

  async findAll(organizationId: string): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { organizationId },
      relations: ['employee', 'employee.user', 'document'],
      order: { startDate: 'DESC' },
    });
  }

  async findByEmployee(
    organizationId: string,
    employeeId: string,
    userId: string,
    role: Role
  ): Promise<Contract[]> {
    await this.assertEmployeeInOrg(employeeId, organizationId);

    if (role === Role.EMPLOYEE) {
      const selfId = await this.resolveCallerEmployeeId(userId, organizationId);
      if (!selfId || selfId !== employeeId) {
        throw new ForbiddenException('You can only view your own contracts');
      }
    }

    return this.contractRepository.find({
      where: { organizationId, employeeId },
      relations: ['document'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
    userId: string,
    role: Role
  ): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id, organizationId },
      relations: ['employee', 'employee.user', 'document'],
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (role === Role.EMPLOYEE && contract.employee.userId !== userId) {
      throw new ForbiddenException('You can only view your own contracts');
    }

    return contract;
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateContractDto
  ): Promise<Contract> {
    const existing = await this.contractRepository.findOne({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Contract not found');
    }
    if (dto.documentId) {
      await this.assertDocumentInOrg(dto.documentId, organizationId);
    }

    const start =
      dto.startDate != null
        ? new Date(dto.startDate)
        : existing.startDate;
    const end =
      dto.endDate !== undefined
        ? dto.endDate != null
          ? new Date(dto.endDate)
          : null
        : existing.endDate ?? null;
    if (end && end < start) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    await this.contractRepository.update(id, {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && {
        endDate: dto.endDate != null ? new Date(dto.endDate) : null,
      }),
      ...(dto.salary !== undefined && { salary: dto.salary }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.documentId !== undefined && { documentId: dto.documentId }),
    });

    return this.findOne(organizationId, id, '', Role.ADMIN);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const existing = await this.contractRepository.findOne({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Contract not found');
    }
    const result = await this.contractRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Contract not found');
    }
  }
}
