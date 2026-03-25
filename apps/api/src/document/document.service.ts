import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@org/shared-types';
import { Document } from './entities/document.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User } from '../user/entities/user.entity';
import { StorageService } from '../storage/storage.service';

function isPrivilegedDocumentRole(role: Role | undefined): boolean {
  return (
    role === Role.SUPER_ADMIN ||
    role === Role.ADMIN ||
    role === Role.MANAGER
  );
}

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  /** Prefer DB role so JWT drift cannot hide org-wide documents from admins/managers. */
  private async resolveRole(userId: string, jwtRole: Role): Promise<Role> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'role'],
    });
    return user?.role ?? jwtRole;
  }

  async findAll(
    organizationId: string,
    userId: string,
    jwtRole: Role,
    employeeIdFilter?: string,
  ): Promise<Document[]> {
    const role = await this.resolveRole(userId, jwtRole);
    const isPrivileged = isPrivilegedDocumentRole(role);

    if (employeeIdFilter) {
      if (!isPrivileged) {
        const employee = await this.employeeRepository.findOne({
          where: { userId, organizationId },
        });
        if (!employee || employee.id !== employeeIdFilter) {
          return [];
        }
      }
      return this.documentRepository.find({
        where: { organizationId, employeeId: employeeIdFilter },
        relations: ['employee'],
        order: { createdAt: 'DESC' },
      });
    }

    if (isPrivileged) {
      return this.documentRepository.find({
        where: { organizationId },
        relations: ['employee'],
        order: { createdAt: 'DESC' },
      });
    }
    const employee = await this.employeeRepository.findOne({
      where: { userId, organizationId },
    });
    if (!employee) {
      return [];
    }
    return this.documentRepository.find({
      where: [
        { organizationId, employeeId: null },
        { organizationId, employeeId: employee.id },
      ],
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    organizationId: string,
    id: string,
    userId?: string,
    jwtRole?: Role,
  ): Promise<Document | null> {
    const doc = await this.documentRepository.findOne({
      where: { id, organizationId },
    });
    if (!doc) return null;
    let role = jwtRole;
    if (userId) {
      role = await this.resolveRole(userId, jwtRole ?? Role.EMPLOYEE);
    }
    const isPrivileged = isPrivilegedDocumentRole(role);
    if (isPrivileged) return doc;
    if (doc.employeeId === null) return doc;
    const employee = await this.employeeRepository.findOne({
      where: { userId: userId!, organizationId },
    });
    if (employee?.id === doc.employeeId) return doc;
    return null;
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[\x00-\x1F\x7F]/g, '')
      .replace(/\u00F0/g, '') // ð
      .replace(/\s+/g, ' ')
      .trim() || name;
  }

  async create(
    organizationId: string,
    userId: string,
    file: Express.Multer.File,
    employeeId?: string | null,
  ): Promise<Document> {
    const { url, key } = await this.storageService.upload(file, 'documents');

    const doc = this.documentRepository.create({
      name: this.sanitizeFileName(file.originalname),
      key,
      url,
      mimeType: file.mimetype,
      size: file.size,
      organizationId,
      uploadedById: userId,
      employeeId: employeeId ?? null,
    });
    return this.documentRepository.save(doc);
  }

  async remove(organizationId: string, id: string): Promise<void> {
    const doc = await this.documentRepository.findOne({
      where: { id, organizationId },
    });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    try {
      await this.storageService.delete(doc.key);
    } catch {
      // Continue to remove DB record even if S3 delete fails
    }
    await this.documentRepository.remove(doc);
  }
}
