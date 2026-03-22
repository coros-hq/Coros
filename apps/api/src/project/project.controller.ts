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
import { ProjectService } from './project.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@org/shared-types';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateKanbanColumnDto } from './dto/create-kanban-column.dto';
import { ReorderKanbanColumnsDto } from './dto/reorder-kanban-columns.dto';
import { UpdateKanbanColumnDto } from './dto/update-kanban-column.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get(':projectId/kanban-columns')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  listKanbanColumns(
    @Param('projectId') projectId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    return this.projectService.listKanbanColumns(organizationId, projectId);
  }

  @Post(':projectId/kanban-columns')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  createKanbanColumn(
    @Param('projectId') projectId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: CreateKanbanColumnDto,
  ) {
    return this.projectService.createKanbanColumn(
      organizationId,
      projectId,
      dto.name,
    );
  }

  @Patch(':projectId/kanban-columns/reorder')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  reorderKanbanColumns(
    @Param('projectId') projectId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: ReorderKanbanColumnsDto,
  ) {
    return this.projectService.reorderKanbanColumns(
      organizationId,
      projectId,
      dto.orderedIds,
    );
  }

  @Patch(':projectId/kanban-columns/:columnId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  updateKanbanColumn(
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateKanbanColumnDto,
  ) {
    return this.projectService.updateKanbanColumn(
      organizationId,
      projectId,
      columnId,
      dto.name,
    );
  }

  @Delete(':projectId/kanban-columns/:columnId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
  async deleteKanbanColumn(
    @Param('projectId') projectId: string,
    @Param('columnId') columnId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    await this.projectService.deleteKanbanColumn(
      organizationId,
      projectId,
      columnId,
    );
    return { message: 'Column deleted successfully' };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async create(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.create(organizationId, userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findAll(
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.projectService.findAll(organizationId, userId, role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async findOne(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.projectService.findOne(organizationId, id, userId, role);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    await this.projectService.remove(organizationId, id);
    return { message: 'Project deleted successfully' };
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async addMember(
    @Param('id') id: string,
    @CurrentUser('organizationId') organizationId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.projectService.addMember(organizationId, id, dto);
  }

  @Delete(':id/members/:employeeId')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async removeMember(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser('organizationId') organizationId: string,
  ) {
    await this.projectService.removeMember(organizationId, id, employeeId);
    return { message: 'Member removed successfully' };
  }
}
