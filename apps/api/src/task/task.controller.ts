import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@org/shared-types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('projects/:projectId/tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.create(organizationId, projectId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.taskService.findAll(organizationId, projectId);
  }

  @Patch(':taskId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(
      organizationId,
      projectId,
      taskId,
      dto,
      userId,
      role,
    );
  }

  @Delete(':taskId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    await this.taskService.remove(organizationId, projectId, taskId);
    return { message: 'Task deleted successfully' };
  }
}
