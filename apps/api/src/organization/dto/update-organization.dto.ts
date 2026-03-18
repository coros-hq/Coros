import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
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
  @IsEnum(OrganizationSize)
  size?: OrganizationSize;
}
