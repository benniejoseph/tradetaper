// src/types/trade.ts

export interface Tag {
  id: string;
  name: string;
  color?: string; // Optional color from backend
  // userId is likely not needed on frontend for display
}
export enum AssetType {
  STOCK = 'Stock',
  CRYPTO = 'Crypto',
  FOREX = 'Forex',
  FUTURES = 'Futures',
  OPTIONS = 'Options',
}

export enum TradeDirection {
  LONG = 'Long',
  SHORT = 'Short',
}

export enum TradeStatus {
    OPEN = 'Open',
    CLOSED = 'Closed',
    PENDING = 'Pending',
}

export interface Trade {
  id: string;
  userId: string;
  assetType: AssetType;
  symbol: string;
  direction: TradeDirection;
  status: TradeStatus;
  entryDate: string; // Keep as string for consistency with form inputs & API responses
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  commission: number;
  notes?: string;
  profitOrLoss?: number;
  rMultiple?: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
  updatedAt: string;
  strategyTag?: string;
  setupDetails?: string;
  mistakesMade?: string;
  lessonsLearned?: string;
  imageUrl?: string;
  tags: Tag[];
}

// For creating a new trade - matches backend CreateTradeDto
export interface CreateTradePayload {
  assetType: AssetType;
  symbol: string;
  direction: TradeDirection;
  status?: TradeStatus;
  entryDate: string; // ISO String
  entryPrice: number;
  exitDate?: string;  // ISO String
  exitPrice?: number;
  quantity: number;
  commission?: number;
  notes?: string;
  stopLoss?: number;
  takeProfit?: number;
  strategyTag?: string;
  setupDetails?: string;
  mistakesMade?: string;
  lessonsLearned?: string;
  imageUrl?: string;
  tagNames?: string[];
}

// For updating a trade - matches backend UpdateTradeDto (all optional)
export type UpdateTradePayload = Partial<CreateTradePayload>;