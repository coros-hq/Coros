import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../project/entities/project.entity';
import { ProjectKanbanColumn } from '../project/entities/project-kanban-column.entity';
import { ProjectMember } from '../project/entities/project-member.entity';
import { Employee } from '../employee/entities/employee.entity';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      Project,
      ProjectKanbanColumn,
      ProjectMember,
      Employee,
    ]),
    ProjectModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
