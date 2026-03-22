import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LeaveRequestStatus, Role } from '@org/shared-types';
import { NewLeaveRequestDto } from './dto/new-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Controller('leave-request')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.leaveRequestService.findAllForUser(
      userId,
      organizationId,
      role,
    );
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async create(
    @Body() dto: NewLeaveRequestDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return await this.leaveRequestService.create(dto, userId, role);
  }

  @Get('employee/:employeeId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getByEmployee(@Param('employeeId') employeeId: string) {
    return await this.leaveRequestService.findByEmployeeId(employeeId);
  }

  @Get('status/:status')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async getByStatus(@Param('status') status: LeaveRequestStatus) {
    return await this.leaveRequestService.findByStatus(status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getOne(@Param('id') id: string) {
    return await this.leaveRequestService.findOne(id);
  }

  @Patch('approve/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return await this.leaveRequestService.approve(id, userId);
  }

  @Patch('reject/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async reject(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return await this.leaveRequestService.reject(id, userId);
  }

  @Patch('cancel/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return await this.leaveRequestService.cancel(id, userId, organizationId);
  }

  @Put('update/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveRequestDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('role') role: Role,
  ) {
    return await this.leaveRequestService.updateForUser(
      id,
      dto,
      userId,
      organizationId,
      role,
    );
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async delete(@Param('id') id: string) {
    await this.leaveRequestService.delete(id);
    return { message: 'Leave request deleted successfully' };
  }
}
