import { IsBoolean, IsEnum, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { OrganizationSize } from '@org/shared-types';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsUUID()
  industryId?: string;

  @IsOptional()
  @IsEnum(OrganizationSize)
  size?: OrganizationSize;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
