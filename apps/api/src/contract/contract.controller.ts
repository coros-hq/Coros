import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';
import { NewContractDto } from './dto/new-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@Controller('contract')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createContract(@Body() dto: NewContractDto) {
    return await this.contractService.createContract(dto);
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getContractByEmployee(@Param('employeeId') employeeId: string) {
    return await this.contractService.findByEmployeeId(employeeId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getContract(@Param('id') id: string) {
    return await this.contractService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateContract(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto
  ) {
    return await this.contractService.updateContract(id, dto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteContract(@Param('id') id: string) {
    await this.contractService.deleteContract(id);
    return { message: 'Contract deleted successfully' };
  }
}
