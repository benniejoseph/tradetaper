import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

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
}

export class CreateManualMT5AccountDto {
  @IsNotEmpty()
  @IsString()
  accountName: string;

  @IsOptional()
  @IsString()
  server?: string;

  @IsOptional()
  @IsString()
  login?: string;

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
}

export class MT5AccountResponseDto {
  id: string;
  accountName: string;
  server: string;
  login: string;
  isActive: boolean;
  balance: number;
  accountType?: string;
  currency?: string;
  lastSyncAt?: Date;
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