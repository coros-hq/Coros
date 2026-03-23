import { IsOptional, IsUUID } from 'class-validator';

export class CreateDocumentDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
