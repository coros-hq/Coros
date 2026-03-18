import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { LeaveType } from '@org/shared-types';

export class NewLeaveRequestDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type!: LeaveType;

  @IsDateString()
  @IsNotEmpty()
  startDate!: string;

  @IsDateString()
  @IsNotEmpty()
  endDate!: string;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  reason?: string;

  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;
}
