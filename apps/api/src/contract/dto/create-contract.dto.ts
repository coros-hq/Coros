import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ContractType } from '@org/shared-types';

export class CreateContractDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @IsEnum(ContractType)
  @IsNotEmpty()
  type!: ContractType;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  @Length(3, 10)
  currency?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  documentId?: string;
}
