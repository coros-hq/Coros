import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeaveBalanceService } from './leave-balance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@org/shared-types';
import { NewLeaveBalanceDto } from './dto/new-leave-balance.dto';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';

@ApiTags('leave-balance')
@ApiBearerAuth('JWT')
@Controller('leave-balance')
export class LeaveBalanceController {
  constructor(private readonly leaveBalanceService: LeaveBalanceService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getMe(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.leaveBalanceService.findByUserIdAndOrganization(
      userId,
      organizationId,
    );
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(@Body() dto: NewLeaveBalanceDto) {
    return await this.leaveBalanceService.create(dto);
  }

  @Get('employee/:employeeId/year/:year')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getByEmployeeAndYear(
    @Param('employeeId') employeeId: string,
    @Query('year') year: string
  ) {
    return await this.leaveBalanceService.findByEmployeeAndYear(
      employeeId,
      year
    );
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return await this.leaveBalanceService.findByEmployeeId(employeeId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getOne(@Param('id') id: string) {
    return await this.leaveBalanceService.findOne(id);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveBalanceDto
  ) {
    return await this.leaveBalanceService.update(id, dto);
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async delete(@Param('id') id: string) {
    await this.leaveBalanceService.delete(id);
    return { message: 'Leave balance deleted successfully' };
  }
}
