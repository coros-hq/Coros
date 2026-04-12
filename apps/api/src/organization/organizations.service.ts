import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { OrganizationBrandingDto } from '@org/shared-types';
import { Not, Repository } from 'typeorm';
import { Organization } from '../organization/entities/organization.entity';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { StorageService } from '../storage/storage.service';

const BRANDING_LOGO_MAX_BYTES = 2 * 1024 * 1024;
const BRANDING_LOGO_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly storageService: StorageService,
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

    if (dto.logoUrl !== undefined) org.logoUrl = dto.logoUrl;
    if (dto.website !== undefined) org.website = dto.website;
    if (dto.industryId !== undefined) org.industryId = dto.industryId;
    if (dto.size !== undefined) org.size = dto.size;
    if (dto.isActive !== undefined) org.isActive = dto.isActive;

    return this.organizationRepository.save(org);
  }

  toBrandingDto(org: Organization): OrganizationBrandingDto {
    return {
      logoUrl: org.logoUrl ?? undefined,
      brandColor: org.brandColor ?? undefined,
    };
  }

  async getBranding(organizationId: string): Promise<OrganizationBrandingDto> {
    const org = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return this.toBrandingDto(org);
  }

  async updateBranding(
    organizationId: string,
    file: Express.Multer.File | undefined,
    brandColor: string | undefined,
  ): Promise<OrganizationBrandingDto> {
    const org = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (file) {
      if (file.size > BRANDING_LOGO_MAX_BYTES) {
        throw new BadRequestException('Logo must be 2MB or smaller');
      }
      if (!BRANDING_LOGO_MIMES.has(file.mimetype)) {
        throw new BadRequestException('Logo must be JPEG, PNG, or WebP');
      }
      const { url } = await this.storageService.upload(file, 'organization-logos');
      org.logoUrl = url;
    }

    if (brandColor !== undefined) {
      const trimmed = brandColor.trim();
      if (trimmed === '') {
        org.brandColor = null;
      } else if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
        throw new BadRequestException(
          'brandColor must be a 6-digit hex color (e.g. #4F46E5)',
        );
      } else {
        org.brandColor = trimmed;
      }
    }

    const saved = await this.organizationRepository.save(org);
    return this.toBrandingDto(saved);
  }
}
