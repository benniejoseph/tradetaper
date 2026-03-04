import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AdminMfaBootstrapStartDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
