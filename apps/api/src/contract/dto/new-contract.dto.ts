import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { EmploymentType } from '@org/shared-types';

export class NewContractDto {
  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsEnum(EmploymentType)
  @IsNotEmpty()
  contractType!: EmploymentType;

  @IsString()
  @IsNotEmpty()
  contractFile!: string;

  @IsNumber()
  @IsNotEmpty()
  salary!: number;

  @IsString()
  @IsNotEmpty()
  @Length(3, 10)
  currency!: string;

  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;
}
