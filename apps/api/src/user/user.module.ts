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

@Module({
  imports: [TypeOrmModule.forFeature([User, Employee, Department, Position])],
  controllers: [UsersController, MeController],
  providers: [UsersService, MeService],
})
export class UsersModule {}
