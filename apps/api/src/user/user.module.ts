import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './user.controller';
import { UsersService } from './user.service';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { Employee } from '../employee/entities/employee.entity';
import { Department } from '../department/entities/department.entity';
import { Position } from '../position/entities/position.entity';
import { Task } from '../task/entities/task.entity';
import { Project } from '../project/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Employee,
      Department,
      Position,
      Task,
      Project,
    ]),
  ],
  controllers: [UsersController, MeController],
  providers: [UsersService, MeService],
})
export class UsersModule {}
