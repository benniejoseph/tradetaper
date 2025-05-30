// src/trades/dto/trade-response.dto.ts
// For now, we can assume the Trade entity itself is safe to return after stripping user password.
// If you add methods to Trade entity that shouldn't be serialized, or want to transform data, use a DTO.
// For simplicity, we might just return the `Trade` entity or a selection of its fields.
// This DTO can be expanded later if needed.
import {
  AssetType,
  TradeDirection,
  TradeStatus,
} from '../entities/trade.entity';

export class TradeResponseDto {
  id: string;
  userId: string; // Expose userId
  assetType: AssetType;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  entryDate: Date; // Or string if you prefer ISO strings in response
  entryPrice: number;
  exitDate?: Date; // Or string
  exitPrice?: number;
  quantity: number;
  commission: number;
  notes?: string;
  profitOrLoss?: number;
  rMultiple?: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: Date; // Or string
  updatedAt: Date; // Or string
}
