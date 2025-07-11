// src/predictive-trades/dto/create-prediction.dto.ts
import { IsString, IsNumber, IsIn, IsOptional } from 'class-validator';

export class CreatePredictionDto {
  @IsString()
  instrument: string;

  @IsIn(['buy', 'sell'])
  direction: 'buy' | 'sell';

  @IsNumber()
  entryPrice: number;

  @IsNumber()
  stopLoss: number;

  @IsNumber()
  takeProfit: number;

  @IsNumber()
  @IsOptional()
  expectedDurationHours?: number;
} 