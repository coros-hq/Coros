import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EmployeeService } from './employee.service';
import { Employee } from './entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { Department } from '../department/entities/department.entity';
import { Position } from '../position/entities/position.entity';
import { Task } from '../task/entities/task.entity';
import { NotificationService } from '../notification/notification.service';
import { InviteService } from '../invite/invite.service';
import { EmailService } from '../email/email.service';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: DataSource, useValue: {} },
        { provide: getRepositoryToken(Employee), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Department), useValue: {} },
        { provide: getRepositoryToken(Position), useValue: {} },
        { provide: getRepositoryToken(Task), useValue: {} },
        { provide: NotificationService, useValue: {} },
        { provide: InviteService, useValue: {} },
        { provide: EmailService, useValue: {} },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
