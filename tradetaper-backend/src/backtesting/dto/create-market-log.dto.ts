import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import {
  TradingSession,
  MarketMovementType,
  MarketSentiment,
} from '../../types/enums';
import { Timeframe } from '../entities/backtest-trade.entity';

export class CreateMarketLogDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsDateString()
  @IsNotEmpty()
  tradeDate: string;

  @IsEnum(Timeframe)
  @IsNotEmpty()
  timeframe: Timeframe;

  @IsEnum(TradingSession)
  @IsOptional()
  session?: TradingSession;

  // Time range in EST/EDT (America/New_York) - send time string like "09:30"
  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsNotEmpty()
  observation: string;

  @IsEnum(MarketMovementType)
  @IsOptional()
  movementType?: MarketMovementType;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  significance?: number;

  @IsEnum(MarketSentiment)
  @IsOptional()
  sentiment?: MarketSentiment;

  @IsUrl()
  @IsOptional()
  screenshotUrl?: string;
}
