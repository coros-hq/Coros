import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { NewDepartmentDto } from './dto/new-department.dto';

/** Matches web `DEPARTMENT_COLORS[0]` when no color is sent (e.g. import flow). */
const DEFAULT_DEPARTMENT_COLOR = '#6366f1';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>
  ) {}

  async createDepartment(
    organizationId: string,
    department: NewDepartmentDto
  ): Promise<Department> {
    const color =
      department.color?.trim() || DEFAULT_DEPARTMENT_COLOR;
    const newDepartment = this.departmentRepository.create({
      ...department,
      color,
      organization: { id: organizationId },
    });
    return this.departmentRepository.save(newDepartment);
  }

  async updateDepartment(
    id: string,
    department: NewDepartmentDto
  ): Promise<{ message: string }> {
    const updatedDepartment = await this.departmentRepository.update(
      id,
      department
    );
    if (updatedDepartment.affected === 0) {
      throw new NotFoundException('Department not found');
    }
    return { message: 'Department updated successfully' };
  }

  async deleteDepartment(id: string): Promise<void> {
    await this.departmentRepository.softDelete(id);
  }

  async getOrganizationDepartments(
    organizationId: string
  ): Promise<Department[]> {
    return this.departmentRepository.find({
      where: { organization: { id: organizationId } },
    });
  }

  async getDepartmentById(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }
    return department;
  }
}
