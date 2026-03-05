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
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
  ICTConcept,
  TradingSession,
  EmotionalState,
  ExecutionGrade,
  MarketCondition,
  HTFBias,
  Timeframe,
} from '../../types/enums';

const normalizeEnumKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const normalizeEnumValue = <T extends Record<string, string>>(
  value: unknown,
  enumObj: T,
): unknown => {
  if (typeof value !== 'string') return value;

  const raw = value.trim();
  if (!raw) return undefined;

  const lookup = new Map<string, string>();

  for (const [enumKey, enumValue] of Object.entries(enumObj)) {
    const keyNorm = normalizeEnumKey(enumKey);
    const valueNorm = normalizeEnumKey(enumValue);

    lookup.set(keyNorm, enumValue);
    lookup.set(keyNorm.replace(/\s+/g, ''), enumValue);
    lookup.set(valueNorm, enumValue);
    lookup.set(valueNorm.replace(/\s+/g, ''), enumValue);
  }

  const rawNorm = normalizeEnumKey(raw);
  return (
    lookup.get(rawNorm) ??
    lookup.get(rawNorm.replace(/\s+/g, '')) ??
    raw
  );
};

const normalizeBooleanValue = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return value;
  }
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;

  const truthy = new Set([
    'true',
    '1',
    'yes',
    'y',
    'high',
    'major',
    'significant',
    'impactful',
  ]);
  const falsy = new Set([
    'false',
    '0',
    'no',
    'n',
    'none',
    'low',
    'minor',
    'na',
    'n/a',
  ]);

  if (truthy.has(normalized)) return true;
  if (falsy.has(normalized)) return false;

  if (
    normalized.includes('no news') ||
    normalized.includes('without news') ||
    normalized.includes('not impacted')
  ) {
    return false;
  }
  if (
    normalized.includes('high impact') ||
    normalized.includes('major news') ||
    normalized.includes('news driven')
  ) {
    return true;
  }

  return value;
};

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
  @Transform(({ value }) =>
    value === '' || value === 'None' || value === null ? undefined : value,
  )
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
  @Transform(({ value }) => normalizeBooleanValue(value))
  @IsBoolean() // Added for isStarred
  isStarred?: boolean;

  @IsOptional()
  @IsString()
  strategyId?: string;

  @IsOptional()
  @IsUUID()
  disciplineApprovalId?: string;

  @IsOptional()
  @IsNumber()
  swap?: number;

  @IsOptional()
  @IsNumber()
  profitOrLoss?: number;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  externalDealId?: string;

  @IsOptional()
  @IsNumber()
  mt5Magic?: number;

  @IsOptional()
  @IsNumber()
  contractSize?: number;

  @IsOptional()
  @IsString()
  syncSource?: 'local_ea' | 'metaapi' | 'manual';

  // ========== PHASE 1: Psychology & Emotion Tracking ==========
  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value, EmotionalState))
  @IsEnum(EmotionalState)
  emotionBefore?: EmotionalState;

  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value, EmotionalState))
  @IsEnum(EmotionalState)
  emotionDuring?: EmotionalState;

  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value, EmotionalState))
  @IsEnum(EmotionalState)
  emotionAfter?: EmotionalState;

  @IsOptional()
  @IsNumber()
  @Min(1)
  confidenceLevel?: number; // 1-10 scale

  @IsOptional()
  @Transform(({ value }) => normalizeBooleanValue(value))
  @IsBoolean()
  followedPlan?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ruleViolations?: string[];

  // ========== PHASE 2: Advanced Performance Metrics ==========
  @IsOptional()
  @IsNumber()
  plannedRR?: number;

  @IsOptional()
  @IsNumber()
  maePrice?: number;

  @IsOptional()
  @IsNumber()
  mfePrice?: number;

  @IsOptional()
  @IsNumber()
  maePips?: number;

  @IsOptional()
  @IsNumber()
  mfePips?: number;

  @IsOptional()
  @IsNumber()
  slippage?: number;

  @IsOptional()
  @IsEnum(ExecutionGrade)
  executionGrade?: ExecutionGrade;

  // ========== PHASE 3: Market Context ==========
  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value, MarketCondition))
  @IsEnum(MarketCondition)
  marketCondition?: MarketCondition;

  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value, Timeframe))
  @IsEnum(Timeframe)
  timeframe?: Timeframe;

  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value, HTFBias))
  @IsEnum(HTFBias)
  htfBias?: HTFBias;

  @IsOptional()
  @Transform(({ value }) => normalizeBooleanValue(value))
  @IsBoolean()
  newsImpact?: boolean;

  // ========== PHASE 4: Pre-Trade Checklist ==========
  @IsOptional()
  @IsString()
  entryReason?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  confirmations?: string[];

  @IsOptional()
  @Transform(({ value }) => normalizeBooleanValue(value))
  @IsBoolean()
  hesitated?: boolean;

  @IsOptional()
  @Transform(({ value }) => normalizeBooleanValue(value))
  @IsBoolean()
  preparedToLose?: boolean;

  // ========== PHASE 5: Environmental Factors ==========
  @IsOptional()
  @IsNumber()
  @Min(1)
  sleepQuality?: number; // 1-5 scale

  @IsOptional()
  @IsNumber()
  @Min(1)
  energyLevel?: number; // 1-5 scale

  @IsOptional()
  @IsNumber()
  @Min(1)
  distractionLevel?: number; // 1-5 scale

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tradingEnvironment?: string;

  // rMultiple will typically be calculated by the backend
}
