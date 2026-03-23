import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@org/shared-types';
import { Document } from './entities/document.entity';
import { Employee } from '../employee/entities/employee.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly storageService: StorageService,
  ) {}

  async findAll(
    organizationId: string,
    userId: string,
    role: Role,
    employeeIdFilter?: string,
  ): Promise<Document[]> {
    const isAdmin =
      role === 'super_admin' || role === 'admin' || role === 'manager';

    if (employeeIdFilter) {
      if (!isAdmin) {
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

    if (isAdmin) {
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
    role?: Role,
  ): Promise<Document | null> {
    const doc = await this.documentRepository.findOne({
      where: { id, organizationId },
    });
    if (!doc) return null;
    const isAdmin =
      !role || role === 'super_admin' || role === 'admin' || role === 'manager';
    if (isAdmin) return doc;
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
    const doc = await this.findOne(organizationId, id);
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
