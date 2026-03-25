import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { TaskComment } from './entities/task-comment.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectKanbanColumn } from '../project/entities/project-kanban-column.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { TaskService } from './task.service';
import { TaskCommentService } from './task-comment.service';
import { TaskController } from './task.controller';
import { TaskCommentController } from './task-comment.controller';
import { ProjectModule } from '../project/project.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskComment,
      Project,
      ProjectKanbanColumn,
      ProjectMember,
      Employee,
      User,
    ]),
    ProjectModule,
    NotificationModule,
  ],
  controllers: [TaskController, TaskCommentController],
  providers: [TaskService, TaskCommentService],
})
export class TaskModule {}
