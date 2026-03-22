import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends OmitType(
  PartialType(CreateProjectDto),
  ['memberIds'] as const,
) {}
