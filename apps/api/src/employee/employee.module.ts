import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { Employee } from './entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';
import { LeaveBalance } from '../leave-balance/entities/leave-balance.entity';
import { Department } from '../department/entities/department.entity';
import { Position } from '../position/entities/position.entity';
import { Task } from '../task/entities/task.entity';
import { NotificationModule } from '../notification/notification.module';
import { InviteModule } from '../invite/invite.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Employee,
      User,
      LeaveRequest,
      LeaveBalance,
      Department,
      Position,
      Task,
    ]),
    NotificationModule,
    InviteModule,
    EmailModule,
  ],
  providers: [EmployeeService],
  controllers: [EmployeeController],
})
export class EmployeeModule {}
