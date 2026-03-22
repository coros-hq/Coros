import { ArrayMinSize, IsUUID } from 'class-validator';

export class ReorderKanbanColumnsDto {
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  orderedIds!: string[];
}
