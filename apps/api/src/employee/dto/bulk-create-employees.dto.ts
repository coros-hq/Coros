import { ArrayMaxSize, ArrayMinSize, IsArray } from 'class-validator';

export const BULK_CREATE_EMPLOYEES_MAX = 200;

/**
 * Nested `NewEmployeeDto` via `@Type` + global ValidationPipe can yield instances
 * where `email` is not readable like plain JSON. Rows stay as plain objects; the
 * service runs `plainToInstance` + `validateSync` per row.
 */
export class BulkCreateEmployeesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_CREATE_EMPLOYEES_MAX)
  employees!: unknown[];
}
