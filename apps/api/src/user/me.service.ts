import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity';
import { Department } from '../department/entities/department.entity';
import { Position } from '../position/entities/position.entity';
import { Task } from '../task/entities/task.entity';
import { EmploymentType, Status } from '@org/shared-types';
import { SetupAccountDto } from './dto/setup-account.dto';

@Injectable()
export class MeService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async getEmployee(
    userId: string,
    organizationId: string,
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { userId, organizationId, deletedAt: IsNull() },
      relations: ['department', 'position', 'user'],
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }
    return employee;
  }

  async getMyTasks(
    userId: string,
    organizationId: string,
  ) {
    const employee = await this.employeeRepository.findOne({
      where: { userId, organizationId, deletedAt: IsNull() },
    });
    if (!employee) {
      return [];
    }
    const tasks = await this.taskRepository.find({
      where: {
        assigneeId: employee.id,
        organizationId,
      },
      relations: ['assignee', 'assignee.user', 'kanbanColumn', 'project'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
    return tasks;
  }

  async getSetupStatus(
    userId: string,
    organizationId: string,
  ): Promise<{ setupRequired: boolean }> {
    const employee = await this.employeeRepository.findOne({
      where: { userId, organizationId, deletedAt: IsNull() },
    });
    return { setupRequired: employee === null };
  }

  async setup(
    userId: string,
    organizationId: string,
    dto: SetupAccountDto,
  ): Promise<Employee> {
    const existing = await this.employeeRepository.findOne({
      where: { userId, organizationId, deletedAt: IsNull() },
    });
    if (existing) {
      throw new BadRequestException('Setup has already been completed');
    }

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const deptRepo = manager.getRepository(Department);
      const posRepo = manager.getRepository(Position);
      const empRepo = manager.getRepository(Employee);

      const dept = await deptRepo.save(
        deptRepo.create({
          name: dto.departmentName,
          color: dto.departmentColor ?? '#6366f1',
          organization: { id: organizationId },
        }),
      );

      const pos = await posRepo.save(
        posRepo.create({
          name: dto.positionTitle,
          department: { id: dept.id },
        }),
      );

      const emp = await empRepo.save(
        empRepo.create({
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          dateOfBirth: new Date(dto.dateOfBirth),
          address: dto.address,
          emergencyContactName: dto.emergencyContactName,
          emergencyContactPhone: dto.emergencyContactPhone,
          userId,
          organizationId,
          departmentId: dept.id,
          positionId: pos.id,
          status: Status.ACTIVE,
          hireDate: new Date(),
          employmentType: EmploymentType.FULL_TIME,
        }),
      );

      return emp;
    });
  }
}
