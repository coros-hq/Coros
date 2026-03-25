import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@org/shared-types';
import { TaskComment } from './entities/task-comment.entity';
import { Task } from './entities/task.entity';
import { User } from '../user/entities/user.entity';
import { ProjectService } from '../project/project.service';

export interface TaskCommentAuthorDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TaskCommentResponseDto {
  id: string;
  content: string;
  taskId: string;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  author: TaskCommentAuthorDto;
}

@Injectable()
export class TaskCommentService {
  constructor(
    @InjectRepository(TaskComment)
    private readonly taskCommentRepository: Repository<TaskComment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly projectService: ProjectService,
  ) {}

  private mapAuthor(user: User): TaskCommentAuthorDto {
    const emp = user.employee;
    return {
      id: user.id,
      firstName: emp?.firstName ?? user.firstName,
      lastName: emp?.lastName ?? user.lastName,
      email: user.email,
    };
  }

  private toResponse(comment: TaskComment): TaskCommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.taskId,
      projectId: comment.projectId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: this.mapAuthor(comment.author),
    };
  }

  async create(
    organizationId: string,
    projectId: string,
    taskId: string,
    authorId: string,
    role: Role,
    content: string,
  ): Promise<TaskCommentResponseDto> {
    await this.projectService.findOne(organizationId, projectId, authorId, role);

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId, organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const row = this.taskCommentRepository.create({
      content,
      taskId,
      projectId,
      authorId,
    });
    const saved = await this.taskCommentRepository.save(row);

    const withAuthor = await this.taskCommentRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['author', 'author.employee'],
    });
    return this.toResponse(withAuthor);
  }

  async findAll(
    organizationId: string,
    projectId: string,
    taskId: string,
    userId: string,
    role: Role,
  ): Promise<TaskCommentResponseDto[]> {
    await this.projectService.findOne(organizationId, projectId, userId, role);

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId, organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comments = await this.taskCommentRepository.find({
      where: { taskId, projectId },
      relations: ['author', 'author.employee'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((c) => this.toResponse(c));
  }

  async remove(
    organizationId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    userId: string,
    role: Role,
  ): Promise<void> {
    await this.projectService.findOne(organizationId, projectId, userId, role);

    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId, organizationId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = await this.taskCommentRepository.findOne({
      where: { id: commentId, taskId, projectId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAdminOrManager =
      role === Role.SUPER_ADMIN ||
      role === Role.ADMIN ||
      role === Role.MANAGER;

    if (!isAdminOrManager && comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const result = await this.taskCommentRepository.softDelete({ id: commentId });
    if (result.affected === 0) {
      throw new NotFoundException('Comment not found');
    }
  }
}
