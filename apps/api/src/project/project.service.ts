import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectKanbanColumn } from './entities/project-kanban-column.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { Task } from '../task/entities/task.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import {
  ProjectMemberRole,
  ProjectStatus,
  Role,
  TaskStatus,
} from '@org/shared-types';

@Injectable()
export class ProjectService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectKanbanColumn)
    private readonly kanbanColumnRepository: Repository<ProjectKanbanColumn>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(
    organizationId: string,
    userId: string,
    dto: CreateProjectDto,
  ): Promise<Project> {
    const creator = await this.employeeRepository.findOne({
      where: { userId, organizationId },
    });
    if (!creator) {
      throw new BadRequestException(
        'Only users with an employee profile can create projects',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const projectRepo = manager.getRepository(Project);
      const memberRepo = manager.getRepository(ProjectMember);

      const project = projectRepo.create({
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? ProjectStatus.PLANNING,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        organizationId,
      });
      const savedProject = await projectRepo.save(project);

      const ownerMember = memberRepo.create({
        projectId: savedProject.id,
        employeeId: creator.id,
        role: ProjectMemberRole.OWNER,
      });
      await memberRepo.save(ownerMember);

      const memberIdsToAdd = dto.memberIds ?? [];
      const uniqueMemberIds = [...new Set(memberIdsToAdd)].filter(
        (id) => id !== creator.id,
      );
      for (const employeeId of uniqueMemberIds) {
        const employee = await manager.getRepository(Employee).findOne({
          where: { id: employeeId, organizationId },
        });
        if (employee) {
          const member = memberRepo.create({
            projectId: savedProject.id,
            employeeId,
            role: ProjectMemberRole.MEMBER,
          });
          await memberRepo.save(member);
        }
      }

      return projectRepo.findOneOrFail({
        where: { id: savedProject.id },
        relations: ['members', 'members.employee'],
      });
    });
  }

  async findAll(
    organizationId: string,
    userId: string,
    role: Role,
  ): Promise<
    (Project & {
      memberCount: number;
      taskCount: number;
      completedTaskCount: number;
    })[]
  > {
    const isAdminOrManager =
      role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.MANAGER;

    let projects: Project[];

    if (isAdminOrManager) {
      projects = await this.projectRepository.find({
        where: { organizationId },
        relations: ['members', 'tasks'],
      });
    } else {
      const employee = await this.employeeRepository.findOne({
        where: { userId, organizationId },
      });
      if (!employee) {
        return [];
      }
      projects = await this.projectRepository
        .createQueryBuilder('project')
        .innerJoin('project.members', 'members', 'members.employeeId = :employeeId', {
          employeeId: employee.id,
        })
        .leftJoinAndSelect('project.members', 'm')
        .leftJoinAndSelect('m.employee', 'emp')
        .leftJoinAndSelect('project.tasks', 'tasks')
        .where('project.organizationId = :organizationId', { organizationId })
        .andWhere('project.deletedAt IS NULL')
        .getMany();
    }

    return projects.map((p) => ({
      ...p,
      memberCount: p.members?.length ?? 0,
      taskCount: p.tasks?.length ?? 0,
      completedTaskCount:
        p.tasks?.filter((t) => t.status === TaskStatus.DONE).length ?? 0,
    }));
  }

  async findOne(
    organizationId: string,
    projectId: string,
    userId: string,
    role: Role,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
      relations: ['members', 'members.employee', 'members.employee.user', 'tasks', 'tasks.assignee'],
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdminOrManager =
      role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.MANAGER;

    if (!isAdminOrManager) {
      const employee = await this.employeeRepository.findOne({
        where: { userId, organizationId },
      });
      if (!employee) {
        throw new ForbiddenException('Employee profile not found');
      }
      const isMember = project.members?.some(
        (m) => m.employeeId === employee.id,
      );
      if (!isMember) {
        throw new ForbiddenException('You are not a member of this project');
      }
    }

    return project;
  }

  async update(
    organizationId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (dto.name != null) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description ?? null;
    if (dto.status != null) project.status = dto.status;
    if (dto.startDate !== undefined)
      project.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined)
      project.endDate = dto.endDate ? new Date(dto.endDate) : null;

    return this.projectRepository.save(project);
  }

  async remove(organizationId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Task).softDelete({ projectId });
      await manager.getRepository(Project).softDelete(projectId);
    });
  }

  async addMember(
    organizationId: string,
    projectId: string,
    dto: AddMemberDto,
  ): Promise<ProjectMember> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const employee = await this.employeeRepository.findOne({
      where: { id: dto.employeeId, organizationId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const existing = await this.projectMemberRepository.findOne({
      where: { projectId, employeeId: dto.employeeId },
    });
    if (existing) {
      throw new BadRequestException('Employee is already a member of this project');
    }

    const member = this.projectMemberRepository.create({
      projectId,
      employeeId: dto.employeeId,
      role: dto.role ?? ProjectMemberRole.MEMBER,
    });
    return this.projectMemberRepository.save(member);
  }

  async removeMember(
    organizationId: string,
    projectId: string,
    employeeId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const member = await this.projectMemberRepository.findOne({
      where: { projectId, employeeId },
      relations: ['employee'],
    });
    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    if (member.role === ProjectMemberRole.OWNER) {
      throw new BadRequestException('Cannot remove the project owner');
    }

    await this.projectMemberRepository.delete({ projectId, employeeId });
  }

  async ensureKanbanColumns(
    organizationId: string,
    projectId: string,
  ): Promise<ProjectKanbanColumn[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    let columns = await this.kanbanColumnRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
    if (columns.length === 0) {
      const defaults = [
        { name: 'To Do', position: 0, statusKey: TaskStatus.TODO },
        { name: 'In Progress', position: 1, statusKey: TaskStatus.IN_PROGRESS },
        { name: 'In Review', position: 2, statusKey: TaskStatus.IN_REVIEW },
        { name: 'Done', position: 3, statusKey: TaskStatus.DONE },
      ];
      columns = await this.kanbanColumnRepository.save(
        defaults.map((d) =>
          this.kanbanColumnRepository.create({ ...d, projectId }),
        ),
      );
    }
    return columns;
  }

  async listKanbanColumns(
    organizationId: string,
    projectId: string,
  ): Promise<ProjectKanbanColumn[]> {
    await this.ensureKanbanColumns(organizationId, projectId);
    await this.dedupeKanbanColumnsByDuplicateStatusKeys(projectId);
    return this.kanbanColumnRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  /**
   * Merges accidental duplicate columns that share the same statusKey (e.g. two "Done"
   * defaults). Keeps the lowest-position column and moves tasks off the others.
   */
  private async dedupeKanbanColumnsByDuplicateStatusKeys(
    projectId: string,
  ): Promise<void> {
    const columns = await this.kanbanColumnRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
    const byKey = new Map<string, ProjectKanbanColumn[]>();
    for (const c of columns) {
      if (!c.statusKey) continue;
      const list = byKey.get(c.statusKey) ?? [];
      list.push(c);
      byKey.set(c.statusKey, list);
    }
    let hasDupes = false;
    for (const [, group] of byKey) {
      if (group.length > 1) {
        hasDupes = true;
        break;
      }
    }
    if (!hasDupes) return;

    await this.dataSource.transaction(async (manager) => {
      const taskRepo = manager.getRepository(Task);
      const colRepo = manager.getRepository(ProjectKanbanColumn);
      for (const [, group] of byKey) {
        if (group.length <= 1) continue;
        const sorted = [...group].sort((a, b) => a.position - b.position);
        const keeper = sorted[0];
        if (!keeper) continue;
        for (const victim of sorted.slice(1)) {
          await taskRepo.update(
            { projectId, kanbanColumnId: victim.id },
            { kanbanColumnId: keeper.id },
          );
          await colRepo.delete({ id: victim.id, projectId });
        }
      }
      const remaining = await colRepo.find({
        where: { projectId },
        order: { position: 'ASC' },
      });
      for (let i = 0; i < remaining.length; i++) {
        const col = remaining[i];
        if (!col) continue;
        if (col.position !== i) {
          await colRepo.update({ id: col.id, projectId }, { position: i });
        }
      }
    });
  }

  async createKanbanColumn(
    organizationId: string,
    projectId: string,
    name: string,
  ): Promise<ProjectKanbanColumn> {
    await this.ensureKanbanColumns(organizationId, projectId);
    const existing = await this.kanbanColumnRepository.find({
      where: { projectId },
      order: { position: 'DESC' },
      take: 1,
    });
    const position = (existing[0]?.position ?? -1) + 1;
    const col = this.kanbanColumnRepository.create({
      projectId,
      name,
      position,
      statusKey: null,
    });
    return this.kanbanColumnRepository.save(col);
  }

  async updateKanbanColumn(
    organizationId: string,
    projectId: string,
    columnId: string,
    name: string,
  ): Promise<ProjectKanbanColumn> {
    await this.ensureKanbanColumns(organizationId, projectId);
    const col = await this.kanbanColumnRepository.findOne({
      where: { id: columnId, projectId },
    });
    if (!col) {
      throw new NotFoundException('Column not found');
    }
    col.name = name;
    return this.kanbanColumnRepository.save(col);
  }

  async reorderKanbanColumns(
    organizationId: string,
    projectId: string,
    orderedIds: string[],
  ): Promise<ProjectKanbanColumn[]> {
    const columns = await this.ensureKanbanColumns(organizationId, projectId);
    if (orderedIds.length !== columns.length) {
      throw new BadRequestException('Must include every column id exactly once');
    }
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new BadRequestException('Duplicate column ids in order list');
    }
    const idSet = new Set(columns.map((c) => c.id));
    for (const id of orderedIds) {
      if (!idSet.has(id)) {
        throw new BadRequestException('Invalid column id in order list');
      }
    }
    for (let i = 0; i < orderedIds.length; i++) {
      await this.kanbanColumnRepository.update(
        { id: orderedIds[i], projectId },
        { position: i },
      );
    }
    return this.kanbanColumnRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
  }

  async deleteKanbanColumn(
    organizationId: string,
    projectId: string,
    columnId: string,
  ): Promise<void> {
    const columns = await this.ensureKanbanColumns(organizationId, projectId);
    if (columns.length <= 1) {
      throw new BadRequestException('Cannot delete the last column');
    }
    const victim = columns.find((c) => c.id === columnId);
    if (!victim) {
      throw new NotFoundException('Column not found');
    }
    const target =
      columns.find((c) => c.id !== columnId) ?? columns[0];

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(Task).update(
        { projectId, kanbanColumnId: columnId },
        { kanbanColumnId: target.id },
      );
      await manager.getRepository(ProjectKanbanColumn).delete({
        id: columnId,
        projectId,
      });
    });
  }
}
