// src/statement-parser/dto/upload-statement.dto.ts
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadStatementDto {
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

export class StatementUploadResponseDto {
  id: string;
  fileName: string;
  fileType: string;
  status: string;
  tradesImported: number;
  tradesSkipped: number;
  errorMessage?: string;
  createdAt: Date;
  processedAt?: Date;
}

export class ParsedTrade {
  externalId?: string; // Ticket number from MT4/MT5
  symbol: string;
  side: 'BUY' | 'SELL';
  openTime: Date;
  closeTime?: Date;
  openPrice: number;
  closePrice?: number;
  quantity: number;
  commission?: number;
  swap?: number;
  profit?: number;
  comment?: string;
}
