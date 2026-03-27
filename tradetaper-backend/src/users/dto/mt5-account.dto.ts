import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum TradingAccountCategory {
  PERSONAL = 'personal',
  PROP_FIRM = 'prop_firm',
}

export class CreateMT5AccountDto {
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsNotEmpty()
  @IsString()
  server: string;

  @IsNotEmpty()
  @IsString()
  login: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isRealAccount?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  initialBalance?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  leverage?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  target?: number;

  @IsOptional()
  @IsEnum(TradingAccountCategory)
  accountCategory?: TradingAccountCategory;

  @IsOptional()
  @IsString()
  propFirmPhase?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propDailyMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propProfitTarget?: number;
}

export class CreateManualMT5AccountDto {
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  server?: string;

  @IsNotEmpty()
  @IsString()
  login: string;

  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isRealAccount?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  target?: number;

  @IsOptional()
  @IsEnum(TradingAccountCategory)
  accountCategory?: TradingAccountCategory;

  @IsOptional()
  @IsString()
  propFirmPhase?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propDailyMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propProfitTarget?: number;
}

export class UpdateMT5AccountDto {
  @IsOptional()
  @IsString()
  accountName?: string;

  @IsOptional()
  @IsString()
  server?: string;

  @IsOptional()
  @IsString()
  login?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  accountType?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  initialBalance?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  leverage?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  target?: number;

  @IsOptional()
  @IsEnum(TradingAccountCategory)
  accountCategory?: TradingAccountCategory;

  @IsOptional()
  @IsString()
  propFirmPhase?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propDailyMaxLoss?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  propProfitTarget?: number;
}

export class MT5AccountResponseDto {
  id: string;
  accountName: string;
  server: string;
  login: string;
  isActive: boolean;
  balance?: number;
  equity?: number;
  margin?: number;
  marginFree?: number;
  profit?: number;
  leverage?: number;
  initialBalance?: number;
  accountType?: string;
  currency?: string;
  target?: number;
  accountCategory?: TradingAccountCategory;
  propFirmPhase?: string | null;
  propMaxLoss?: number | null;
  propDailyMaxLoss?: number | null;
  isRealAccount?: boolean;
  connectionStatus?: string;
  deploymentState?: string;
  connectionState?: string;
  isStreamingActive?: boolean;
  metaApiAccountId?: string;
  provisioningProfileId?: string;
  region?: string;
  syncAttempts?: number;
  totalTradesImported?: number;
  lastHeartbeatAt?: Date;
  lastSyncAt?: Date;
  lastSyncError?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeHistoryUploadDto {
  accountId: string;
  fileType: 'html' | 'xlsx';
  fileName: string;
}

export interface ParsedTradeData {
  positionId: string;
  symbol: string;
  type: 'buy' | 'sell';
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: Date;
  closeTime: Date;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
}

export interface TradeHistoryUploadResponse {
  success: boolean;
  message: string;
  tradesImported: number;
  errors?: string[];
  trades?: ParsedTradeData[];
  accountBalance?: number;
  accountCurrency?: string;
  totalNetProfit?: number;
  equity?: number;
}
