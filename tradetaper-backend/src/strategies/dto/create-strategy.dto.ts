import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TradingSession } from '../../types/enums';
import { ChecklistItem } from '../entities/strategy.entity';

export class CreateStrategyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsArray()
  checklist?: ChecklistItem[];

  @IsOptional()
  @IsEnum(TradingSession)
  tradingSession?: TradingSession;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  tags?: string;
}
