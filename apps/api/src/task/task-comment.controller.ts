import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@org/shared-types';
import { TaskCommentService } from './task-comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('projects/:projectId/tasks/:taskId/comments')
export class TaskCommentController {
  constructor(private readonly taskCommentService: TaskCommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async create(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreateCommentDto,
  ) {
    return this.taskCommentService.create(
      organizationId,
      projectId,
      taskId,
      userId,
      role,
      dto.content,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findAll(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.taskCommentService.findAll(
      organizationId,
      projectId,
      taskId,
      userId,
      role,
    );
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    await this.taskCommentService.remove(
      organizationId,
      projectId,
      taskId,
      commentId,
      userId,
      role,
    );
    return { message: 'Comment deleted successfully' };
  }
}
