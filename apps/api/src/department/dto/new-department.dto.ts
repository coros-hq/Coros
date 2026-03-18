import { IsOptional, IsString } from "class-validator";

export class NewDepartmentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    color?: string;
}