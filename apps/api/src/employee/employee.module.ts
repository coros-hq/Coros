import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from './entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';
import { Contract } from '../contract/entities/contract.entity';
import { LeaveBalance } from '../leave-balance/entities/leave-balance.entity';
import { Department } from '../department/entities/department.entity';
import { Position } from '../position/entities/position.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      User,
      LeaveRequest,
      Contract,
      LeaveBalance,
      Department,
      Position,
    ]),
  ],
  providers: [EmployeeService],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
