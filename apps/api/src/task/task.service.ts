import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectKanbanColumn } from '../project/entities/project-kanban-column.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectService } from '../project/project.service';
import { NotificationService } from '../notification/notification.service';
import { Role, TaskPriority, TaskStatus, NotificationType } from '@org/shared-types';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectKanbanColumn)
    private readonly kanbanColumnRepository: Repository<ProjectKanbanColumn>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly projectService: ProjectService,
    private readonly notificationService: NotificationService,
  ) {}

  private async backfillTaskKanbanColumns(projectId: string): Promise<void> {
    const columns = await this.kanbanColumnRepository.find({
      where: { projectId },
      order: { position: 'ASC' },
    });
    if (columns.length === 0) return;

    const tasks = await this.taskRepository.find({ where: { projectId } });
    for (const t of tasks) {
      if (t.kanbanColumnId) continue;
      const match = columns.find((c) => c.statusKey === t.status);
      const col = match ?? columns[0];
      if (col) {
        t.kanbanColumnId = col.id;
        await this.taskRepository.save(t);
      }
    }
  }

  async create(
    organizationId: string,
    projectId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectService.ensureKanbanColumns(organizationId, projectId);

    if (dto.assigneeId) {
      const isMember = await this.projectMemberRepository.findOne({
        where: { projectId, employeeId: dto.assigneeId },
      });
      if (!isMember) {
        throw new BadRequestException(
          'Assignee must be a member of the project',
        );
      }
      const employee = await this.employeeRepository.findOne({
        where: { id: dto.assigneeId, organizationId },
      });
      if (!employee) {
        throw new BadRequestException('Assignee not found');
      }
    }

    let kanbanColumnId = dto.kanbanColumnId ?? null;
    if (kanbanColumnId) {
      const exists = await this.kanbanColumnRepository.findOne({
        where: { id: kanbanColumnId, projectId },
      });
      if (!exists) {
        throw new BadRequestException('Invalid kanban column');
      }
    } else {
      const status = dto.status ?? TaskStatus.TODO;
      const col = await this.kanbanColumnRepository.findOne({
        where: { projectId, statusKey: status },
      });
      if (!col) {
        throw new BadRequestException('Could not resolve kanban column');
      }
      kanbanColumnId = col.id;
    }

    const column = await this.kanbanColumnRepository.findOneOrFail({
      where: { id: kanbanColumnId, projectId },
    });

    let status = dto.status ?? TaskStatus.TODO;
    if (column.statusKey) {
      status = column.statusKey as TaskStatus;
    }

    const task = this.taskRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      status,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      projectId,
      assigneeId: dto.assigneeId ?? null,
      organizationId,
      kanbanColumnId,
    });
    const lastTask = await this.taskRepository.findOne({
      where: { projectId, organizationId },
      order: { number: 'DESC' },
    });
    task.number = (lastTask?.number ?? 0) + 1;
    const saved = await this.taskRepository.save(task);
    await this.projectService.ensureProjectKey(projectId, organizationId);
    return this.taskRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['assignee', 'assignee.user', 'kanbanColumn', 'project'],
    });
  }

  async findOne(
    organizationId: string,
    projectId: string,
    taskId: string,
    userId: string,
    role: Role,
  ): Promise<Task> {
    await this.projectService.findOne(organizationId, projectId, userId, role);
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId, organizationId },
      relations: ['assignee', 'assignee.user', 'kanbanColumn', 'project'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    const key = await this.projectService.ensureProjectKey(projectId, organizationId);
    if (key && task.project) task.project.key = key;
    return task;
  }

  async findAll(organizationId: string, projectId: string): Promise<Task[]> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.projectService.ensureKanbanColumns(organizationId, projectId);
    await this.backfillTaskKanbanColumns(projectId);

    const tasks = await this.taskRepository.find({
      where: { projectId },
      relations: ['assignee', 'assignee.user', 'kanbanColumn', 'project'],
    });

    const drifted = tasks.filter(
      (t) =>
        t.kanbanColumn?.statusKey != null &&
        t.status !== t.kanbanColumn.statusKey,
    );
    if (drifted.length > 0) {
      const columns = await this.kanbanColumnRepository.find({
        where: { projectId },
        order: { position: 'ASC' },
      });
      const firstColByStatusKey = new Map<string, ProjectKanbanColumn>();
      for (const c of columns) {
        if (c.statusKey != null && !firstColByStatusKey.has(c.statusKey)) {
          firstColByStatusKey.set(c.statusKey, c);
        }
      }
      for (const t of drifted) {
        const match = firstColByStatusKey.get(t.status);
        if (match) {
          t.kanbanColumnId = match.id;
          t.kanbanColumn = match;
        } else {
          const key = t.kanbanColumn?.statusKey;
          if (key != null) {
            t.status = key as TaskStatus;
          }
        }
      }
      await this.taskRepository.save(drifted);
    }

    return tasks;
  }

  async update(
    organizationId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    userId: string,
    role: Role,
  ): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId, organizationId },
      relations: ['kanbanColumn'],
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const isAdminOrManager =
      role === Role.SUPER_ADMIN ||
      role === Role.ADMIN ||
      role === Role.MANAGER;

    if (!isAdminOrManager) {
      const employee = await this.employeeRepository.findOne({
        where: { userId, organizationId },
      });
      if (!employee) {
        throw new ForbiddenException('Employee profile not found');
      }
      if (task.assigneeId !== employee.id) {
        throw new ForbiddenException(
          'Only the assignee can update this task',
        );
      }
    }

    await this.projectService.ensureKanbanColumns(organizationId, projectId);

    if (dto.kanbanColumnId !== undefined) {
      if (dto.kanbanColumnId) {
        const col = await this.kanbanColumnRepository.findOne({
          where: { id: dto.kanbanColumnId, projectId },
        });
        if (!col) {
          throw new BadRequestException('Invalid kanban column');
        }
        task.kanbanColumnId = dto.kanbanColumnId;
        if (col.statusKey) {
          task.status = col.statusKey as TaskStatus;
        } else if (dto.status != null) {
          task.status = dto.status;
        }
      } else {
        task.kanbanColumnId = null;
      }
    }

    if (dto.name != null) task.name = dto.name;
    if (dto.description !== undefined) task.description = dto.description ?? null;

    if (
      dto.status != null &&
      (dto.kanbanColumnId === undefined || dto.kanbanColumnId === null)
    ) {
      task.status = dto.status;
      const cols = await this.kanbanColumnRepository.find({
        where: { projectId, statusKey: dto.status },
        order: { position: 'ASC' },
        take: 1,
      });
      const col = cols[0];
      if (!col) {
        throw new BadRequestException(
          `No kanban column for status "${dto.status}" in this project`,
        );
      }
      task.kanbanColumnId = col.id;
    }

    // When the column defines a workflow status, it is canonical (fixes drift e.g. status in_progress + FK to To Do).
    if (task.kanbanColumnId) {
      const col = await this.kanbanColumnRepository.findOne({
        where: { id: task.kanbanColumnId, projectId },
      });
      if (col?.statusKey) {
        task.status = col.statusKey as TaskStatus;
      }
    }

    if (dto.priority != null) task.priority = dto.priority;
    if (dto.dueDate !== undefined)
      task.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;

    const previousAssigneeId = task.assigneeId;
    if (dto.assigneeId !== undefined) {
      if (dto.assigneeId) {
        const isMember = await this.projectMemberRepository.findOne({
          where: { projectId, employeeId: dto.assigneeId },
        });
        if (!isMember) {
          throw new BadRequestException(
            'Assignee must be a member of the project',
          );
        }
        task.assigneeId = dto.assigneeId;
      } else {
        task.assigneeId = null;
      }
    }

    const saved = await this.taskRepository.save(task);
    const result = await this.taskRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['assignee', 'assignee.user', 'kanbanColumn', 'project'],
    });
    const projectKey = await this.projectService.ensureProjectKey(
      projectId,
      organizationId,
    );
    if (projectKey && result.project) result.project.key = projectKey;

    if (
      dto.assigneeId !== undefined &&
      dto.assigneeId !== previousAssigneeId &&
      dto.assigneeId !== null &&
      result.assignee?.userId
    ) {
      try {
        const project = await this.projectRepository.findOne({
          where: { id: projectId },
        });
        await this.notificationService.create({
          userId: result.assignee.userId,
          organizationId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Task assigned to you',
          message: `${result.name} in ${project?.name ?? 'project'}`,
          link: `/projects/${projectId}/tasks`,
        });
      } catch {
        // Notification failures must not break the main operation
      }
    }

    return result;
  }

  async remove(
    organizationId: string,
    projectId: string,
    taskId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const result = await this.taskRepository.softDelete({
      id: taskId,
      projectId,
    });
    if (result.affected === 0) {
      throw new NotFoundException('Task not found');
    }
  }
}
