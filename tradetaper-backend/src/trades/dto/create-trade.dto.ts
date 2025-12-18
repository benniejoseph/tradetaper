/* eslint-disable @typescript-eslint/no-unused-vars */
// src/trades/dto/create-trade.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
  ICTConcept,
  TradingSession,
} from '../../types/enums';

export class CreateTradeDto {
  @IsNotEmpty()
  @IsEnum(AssetType)
  assetType: AssetType;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  symbol: string;

  @IsNotEmpty()
  @IsEnum(TradeDirection)
  side: TradeDirection;

  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus = TradeStatus.OPEN; // Default to OPEN

  @IsNotEmpty()
  @IsDateString() // Expect ISO8601 date string from client
  openTime: string; // Will be converted to Date by TypeORM or service

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  openPrice: number;

  @IsOptional()
  @IsDateString()
  closeTime?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  closePrice?: number;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0.00000001) // Example: ensure quantity is positive
  quantity: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  commission?: number = 0;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  stopLoss?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  takeProfit?: number;

  @IsOptional()
  @IsEnum(ICTConcept)
  ictConcept?: ICTConcept;

  @IsOptional()
  @IsEnum(TradingSession)
  session?: TradingSession;

  @IsOptional()
  @IsString()
  setupDetails?: string;

  @IsOptional()
  @IsString()
  mistakesMade?: string;

  @IsOptional()
  @IsString()
  lessonsLearned?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Each item in the array must be a string
  @ArrayMinSize(0) // Allow empty array, or 1 if at least one tag is required
  tagNames?: string[]; // Frontend will send an array of tag names

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsBoolean() // Added for isStarred
  isStarred?: boolean;

  @IsOptional()
  @IsString()
  strategyId?: string;

  // profitOrLoss and rMultiple will typically be calculated by the backend, not provided by client on create
}
