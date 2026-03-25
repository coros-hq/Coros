import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateContractDto
  ) {
    return await this.contractService.create(organizationId, dto);
  }

  @Get('employee/:employeeId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findByEmployee(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('employeeId') employeeId: string
  ) {
    return await this.contractService.findByEmployee(
      organizationId,
      employeeId,
      userId,
      role
    );
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async findAll(
    @CurrentUser('organizationId') organizationId: string
  ) {
    return await this.contractService.findAll(organizationId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findOne(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string
  ) {
    return await this.contractService.findOne(organizationId, id, userId, role);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto
  ) {
    return await this.contractService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async remove(
    @CurrentUser('organizationId') organizationId: string,
    @Param('id') id: string
  ) {
    await this.contractService.remove(organizationId, id);
    return { message: 'Contract deleted successfully' };
  }
}
