import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { EmploymentType } from '@org/shared-types';

export class UpdateContractDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(EmploymentType)
  @IsOptional()
  contractType?: EmploymentType;

  @IsString()
  @IsOptional()
  contractFile?: string;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  @Length(3, 10)
  currency?: string;
}
