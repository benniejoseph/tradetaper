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
} from 'class-validator';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
} from '../entities/trade.entity';

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
  direction: TradeDirection;

  @IsOptional()
  @IsEnum(TradeStatus)
  status?: TradeStatus = TradeStatus.OPEN; // Default to OPEN

  @IsNotEmpty()
  @IsDateString() // Expect ISO8601 date string from client
  entryDate: string; // Will be converted to Date by TypeORM or service

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  entryPrice: number;

  @IsOptional()
  @IsDateString()
  exitDate?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 8 })
  @Min(0)
  exitPrice?: number;

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
  @IsString()
  @MaxLength(255)
  strategyTag?: string;

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
  @IsUrl({}, { message: 'Please enter a valid URL for the image' }) // Validates if it's a URL format
  @MaxLength(1024)
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Each item in the array must be a string
  @ArrayMinSize(0) // Allow empty array, or 1 if at least one tag is required
  tagNames?: string[]; // Frontend will send an array of tag names

  // profitOrLoss and rMultiple will typically be calculated by the backend, not provided by client on create
}
