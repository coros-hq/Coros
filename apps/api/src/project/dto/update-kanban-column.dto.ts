import { IsString, Length } from 'class-validator';

export class UpdateKanbanColumnDto {
  @IsString()
  @Length(1, 120)
  name!: string;
}
