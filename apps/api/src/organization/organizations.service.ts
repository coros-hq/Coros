import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>
  ) {}

  async getMe(organizationId: string): Promise<Organization> {
    const org = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['industry'],
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async updateMe(organizationId: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (dto.name !== undefined && dto.name !== org.name) {
      const slug = dto.name.toLowerCase().replace(/\s+/g, '-');
      const existing = await this.organizationRepository.findOne({
        where: { slug, id: Not(organizationId) },
      });
      if (existing) {
        throw new BadRequestException('Organization name is already taken');
      }
      org.name = dto.name;
      org.slug = slug;
    }

    if (dto.logo !== undefined) org.logo = dto.logo;
    if (dto.website !== undefined) org.website = dto.website;
    if (dto.industryId !== undefined) org.industryId = dto.industryId;
    if (dto.size !== undefined) org.size = dto.size;
    if (dto.isActive !== undefined) org.isActive = dto.isActive;

    return this.organizationRepository.save(org);
  }
}
