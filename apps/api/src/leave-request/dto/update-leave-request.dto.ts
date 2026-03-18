import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { LeaveRequestStatus, LeaveType } from '@org/shared-types';

export class UpdateLeaveRequestDto {
  @IsEnum(LeaveType)
  @IsOptional()
  type?: LeaveType;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(LeaveRequestStatus)
  @IsOptional()
  status?: LeaveRequestStatus;

  @IsString()
  @IsOptional()
  @Length(0, 255)
  reason?: string;

  @IsUUID()
  @IsOptional()
  approvedById?: string;
}
