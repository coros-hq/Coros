import { IsEnum, IsNotEmpty, IsNumber, IsUUID } from 'class-validator';
import { LeaveType } from '@org/shared-types';

export class NewLeaveBalanceDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  type!: LeaveType;

  @IsNotEmpty()
  year!: string;

  @IsNumber()
  @IsNotEmpty()
  used!: number;

  @IsNumber()
  @IsNotEmpty()
  remaining!: number;

  @IsNumber()
  @IsNotEmpty()
  total!: number;

  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;
}
