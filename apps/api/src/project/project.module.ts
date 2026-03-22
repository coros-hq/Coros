import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectKanbanColumn } from './entities/project-kanban-column.entity';
import { ProjectMember } from './entities/project-member.entity';
import { Task } from '../task/entities/task.entity';
import { Employee } from '../employee/entities/employee.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectKanbanColumn,
      ProjectMember,
      Employee,
      Task,
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
