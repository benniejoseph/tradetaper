// src/auth/dto/register-user.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(10, { message: 'Password must be at least 10 characters long.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must include at least one uppercase letter, one lowercase letter, and one number.',
  })
  @MaxLength(100)
  password: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty() // Optional: make it required
  firstName?: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty() // Optional: make it required
  lastName?: string;
}
