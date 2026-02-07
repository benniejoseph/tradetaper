// src/auth/dto/register-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(100)
  password?: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty() // Optional: make it required
  firstName?: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty() // Optional: make it required
  @IsString()
  @MaxLength(100)
  @IsNotEmpty() // Optional: make it required
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  referralCode?: string;
}
