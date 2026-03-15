import { OrganizationSize } from '@org/shared-types';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  organizationName!: string;

  @IsEnum(OrganizationSize)
  size!: OrganizationSize;

  @IsOptional()
  @IsUUID()
  industryId?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;
}