import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectKanbanColumn } from './entities/project-kanban-column.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Task } from '../task/entities/task.entity';
import { Employee } from '../employee/entities/employee.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { NotificationModule } from '../notification/notification.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectKanbanColumn,
      ProjectMember,
      Employee,
      Task,
    ]),
    NotificationModule,
    EmailModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
