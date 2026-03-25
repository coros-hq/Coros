import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity';
import { Project } from '../project/entities/project.entity';
import { Task } from '../task/entities/task.entity';
import { Document } from '../document/entities/document.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async search(
    organizationId: string,
    query: string,
  ): Promise<{
    employees: Array<{
      id: string;
      firstName: string;
      lastName: string;
      organizationId: string;
      department?: { name: string } | null;
      position?: { name: string } | null;
    }>;
    projects: Array<{
      id: string;
      name: string;
      status: string;
      organizationId: string;
    }>;
    tasks: Array<{
      id: string;
      name: string;
      status: string;
      priority: string;
      projectId: string;
      organizationId: string;
    }>;
    documents: Array<{
      id: string;
      name: string;
      mimeType: string;
      url: string;
      employeeId: string | null;
      organizationId: string;
    }>;
  }> {
    const pattern = `%${query}%`;

    const [employees, projects, tasks, documents] = await Promise.all([
      this.searchEmployees(organizationId, pattern),
      this.searchProjects(organizationId, pattern),
      this.searchTasks(organizationId, pattern),
      this.searchDocuments(organizationId, pattern),
    ]);

    return {
      employees: employees.map((e) => ({
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        organizationId: e.organizationId,
        department: e.department ? { name: e.department.name } : null,
        position: e.position ? { name: e.position.name } : null,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        organizationId: p.organizationId,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        priority: t.priority,
        projectId: t.projectId,
        organizationId: t.organizationId,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        mimeType: d.mimeType,
        url: d.url,
        employeeId: d.employeeId,
        organizationId: d.organizationId,
      })),
    };
  }

  private async searchEmployees(
    organizationId: string,
    pattern: string,
  ): Promise<Employee[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.position', 'position')
      .where('employee.organizationId = :organizationId', { organizationId })
      .andWhere(
        '(employee.firstName ILIKE :pattern OR employee.lastName ILIKE :pattern OR user.email ILIKE :pattern)',
        { pattern },
      )
      .take(5)
      .getMany();
  }

  private async searchProjects(
    organizationId: string,
    pattern: string,
  ): Promise<Project[]> {
    return this.projectRepository
      .createQueryBuilder('project')
      .where('project.organizationId = :organizationId', { organizationId })
      .andWhere(
        '(project.name ILIKE :pattern OR project.description ILIKE :pattern)',
        { pattern },
      )
      .take(5)
      .getMany();
  }

  private async searchTasks(
    organizationId: string,
    pattern: string,
  ): Promise<Task[]> {
    return this.taskRepository
      .createQueryBuilder('task')
      .where('task.organizationId = :organizationId', { organizationId })
      .andWhere(
        '(task.name ILIKE :pattern OR task.description ILIKE :pattern)',
        { pattern },
      )
      .take(5)
      .getMany();
  }

  private async searchDocuments(
    organizationId: string,
    pattern: string,
  ): Promise<Document[]> {
    return this.documentRepository
      .createQueryBuilder('document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.name ILIKE :pattern', { pattern })
      .take(5)
      .getMany();
  }
}
