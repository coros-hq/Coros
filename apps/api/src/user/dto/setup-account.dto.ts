import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetupAccountDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  departmentName!: string;

  @IsOptional()
  @IsString()
  departmentColor?: string;

  @IsString()
  @IsNotEmpty()
  positionTitle!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}
