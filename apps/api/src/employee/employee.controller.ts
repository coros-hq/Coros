import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { NewEmployeeDto } from './dto/new-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@org/shared-types';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post('/create')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createEmployee(
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: NewEmployeeDto
  ): Promise<{ employee: Employee }> {
    return await this.employeeService.createEmployee(organizationId, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async getEmployees(
    @CurrentUser('organizationId') organizationId: string
  ): Promise<Employee[]> {
    return await this.employeeService.getEmployees(organizationId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async getEmployee(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<Employee> {
    return await this.employeeService.getEmployee(id, organizationId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async updateEmployee(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateEmployeeDto
  ): Promise<Employee> {
    return await this.employeeService.updateEmployee(id, organizationId, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteEmployee(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string
  ): Promise<{ message: string }> {
    await this.employeeService.deleteEmployee(id, organizationId);
    return { message: 'Employee deleted successfully' };
  }
}
