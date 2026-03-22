import { IsString, Length } from 'class-validator';

export class CreateKanbanColumnDto {
  @IsString()
  @Length(1, 120)
  name!: string;
}
