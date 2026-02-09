import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TerminalStatus } from '../entities/terminal-instance.entity';

export class CreateTerminalDto {
  @IsUUID()
  accountId: string;
}

export class EnableAutoSyncDto {
  @IsString()
  server: string;

  @IsString()
  login: string;

  @IsString()
  password: string;
}

export class UpdateTerminalStatusDto {
  @IsEnum(TerminalStatus)
  status: TerminalStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsString()
  containerId?: string;
}

export class TerminalHeartbeatDto {
  @IsString()
  terminalId: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  accountInfo?: {
    balance: number;
    equity: number;
    margin: number;
    freeMargin: number;
  };
}

export class TerminalTradeDto {
  @IsString()
  ticket: string;

  @IsString()
  symbol: string;

  @IsString()
  type: 'BUY' | 'SELL';

  @IsOptional()
  @IsNumber()
  volume?: number;

  @IsOptional()
  @IsNumber()
  openPrice?: number;

  @IsOptional()
  @IsNumber()
  closePrice?: number;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsOptional()
  @IsNumber()
  commission?: number;

  @IsOptional()
  @IsNumber()
  swap?: number;

  @IsOptional()
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  positionId?: number;

  @IsOptional()
  @IsNumber()
  magic?: number;

  @IsOptional()
  @IsNumber()
  entryType?: number; // 0 = IN, 1 = OUT, 2 = IN/OUT

  @IsOptional()
  @IsNumber()
  reason?: number;

  @IsOptional()
  @IsNumber()
  stopLoss?: number;

  @IsOptional()
  @IsNumber()
  takeProfit?: number;

  @IsOptional()
  @IsNumber()
  contractSize?: number;
}

export class TerminalSyncDto {
  @IsString()
  terminalId: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminalTradeDto)
  trades: TerminalTradeDto[];
}

export class TerminalPositionDto {
  @IsString()
  ticket: string;

  @IsString()
  symbol: string;

  @IsString()
  type: 'BUY' | 'SELL';

  @IsNumber()
  volume: number;

  @IsNumber()
  openPrice: number;

  @IsNumber()
  currentPrice: number;

  @IsNumber()
  profit: number;

  @IsString()
  openTime: string;
}

export class TerminalPositionsDto {
  @IsString()
  terminalId: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminalPositionDto)
  positions: TerminalPositionDto[];
}

export class TerminalResponseDto {
  id: string;
  accountId: string;
  accountName: string;
  status: TerminalStatus;
  containerId?: string;
  lastHeartbeat?: Date;
  lastSyncAt?: Date;
  createdAt: Date;
}

export class TerminalCandleDto {
  @IsNumber()
  time: number;

  @IsNumber()
  open: number;

  @IsNumber()
  high: number;

  @IsNumber()
  low: number;

  @IsNumber()
  close: number;

  @IsOptional()
  @IsNumber()
  volume?: number;
}

export class TerminalCandlesSyncDto {
  @IsString()
  terminalId: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsString()
  tradeId: string;

  @IsString()
  symbol: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TerminalCandleDto)
  candles: TerminalCandleDto[];
}
