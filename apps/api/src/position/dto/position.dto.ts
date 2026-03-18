import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class NewPositionDto {
    
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsOptional()
    @Length(3, 255)
    description?: string;
}       