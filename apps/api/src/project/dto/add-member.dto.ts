import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectMemberRole } from '@org/shared-types';

export class AddMemberDto {
  @IsUUID()
  employeeId!: string;

  @IsEnum(ProjectMemberRole)
  @IsOptional()
  role?: ProjectMemberRole;
}
