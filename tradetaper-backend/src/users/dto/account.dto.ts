import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountCategory {
  PERSONAL = 'personal',
  PROP_FIRM = 'prop_firm',
}

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
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  target?: number;

  @IsOptional()
  @IsEnum(AccountCategory)
  accountCategory?: AccountCategory;

  @IsOptional()
  @IsString()
  propFirmPhase?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  propMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  propDailyMaxLoss?: number;

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
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  target?: number;

  @IsOptional()
  @IsEnum(AccountCategory)
  accountCategory?: AccountCategory;

  @IsOptional()
  @IsString()
  propFirmPhase?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  propMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  propDailyMaxLoss?: number;
}

export class AccountResponseDto {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description: string;
  isActive: boolean;
  target: number;
  accountCategory: AccountCategory;
  propFirmPhase?: string | null;
  propMaxLoss?: number | null;
  propDailyMaxLoss?: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
