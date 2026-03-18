import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { LeaveType } from '@org/shared-types';

export class UpdateLeaveBalanceDto {
  @IsEnum(LeaveType)
  @IsOptional()
  type?: LeaveType;

  @IsOptional()
  year?: string;

  @IsNumber()
  @IsOptional()
  used?: number;

  @IsNumber()
  @IsOptional()
  remaining?: number;

  @IsNumber()
  @IsOptional()
  total?: number;
}
