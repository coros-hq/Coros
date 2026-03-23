import { IsEmail, IsDefined, IsString, MinLength, IsOptional, ValidateIf } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @ValidateIf((o) => o.newPassword !== undefined)
  @IsDefined({ message: 'currentPassword is required when newPassword is provided' })
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
