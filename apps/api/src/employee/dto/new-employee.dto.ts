import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { EmploymentType, Role } from '@org/shared-types';

export class NewEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  phone!: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsDateString()
  @IsOptional()
  hireDate?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsUUID()
  @IsNotEmpty()
  managerId!: string;

  @IsUUID()
  @IsNotEmpty()
  positionId!: string;

  @IsUUID()
  @IsNotEmpty()
  departmentId!: string;
}
