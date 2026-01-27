import {
  IsEnum,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TradeDirection, TradingSession, ICTConcept } from '../../types/enums';
import {
  Timeframe,
  KillZone,
  MarketStructure,
  HTFBias,
  TradeOutcome,
  DayOfWeek,
} from '../entities/backtest-trade.entity';

export class CreateBacktestTradeDto {
  @IsString()
  strategyId: string;

  @IsString()
  @MaxLength(20)
  symbol: string;

  @IsEnum(TradeDirection)
  direction: TradeDirection;

  @IsNumber()
  @Type(() => Number)
  entryPrice: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  exitPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  takeProfit?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lotSize?: number;

  // Timing
  @IsEnum(Timeframe)
  timeframe: Timeframe;

  @IsOptional()
  @IsEnum(TradingSession)
  session?: TradingSession;

  @IsOptional()
  @IsEnum(KillZone)
  killZone?: KillZone;

  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(23)
  @Type(() => Number)
  hourOfDay?: number;

  @IsDateString()
  tradeDate: string;

  // Setup
  @IsOptional()
  @IsString()
  @MaxLength(100)
  setupType?: string;

  @IsOptional()
  @IsEnum(ICTConcept)
  ictConcept?: ICTConcept;

  @IsOptional()
  @IsEnum(MarketStructure)
  marketStructure?: MarketStructure;

  @IsOptional()
  @IsEnum(HTFBias)
  htfBias?: HTFBias;

  // Results
  @IsEnum(TradeOutcome)
  outcome: TradeOutcome;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pnlPips?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pnlDollars?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rMultiple?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  holdingTimeMinutes?: number;

  // Quality
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  entryQuality?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  executionQuality?: number;

  @IsOptional()
  @IsBoolean()
  followedRules?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  checklistScore?: number;

  // Notes
  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  screenshotUrl?: string;

  @IsOptional()
  @IsString()
  lessonLearned?: string;
}
