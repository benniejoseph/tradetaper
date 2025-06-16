import { IsNotEmpty, IsString, IsOptional, IsNumber, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  target?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  target?: number;
}

export class AccountResponseDto {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description: string;
  isActive: boolean;
  target: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
} 