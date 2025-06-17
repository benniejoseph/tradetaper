// Shared DTOs for backend and frontend

export class UserResponseDto {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TradeResponseDto {
  id: string;
  userId: string;
  assetType: string; // Use string for cross-package compatibility
  symbol: string;
  side: string;
  status: string;
  openTime: Date;
  openPrice: number;
  closeTime?: Date;
  closePrice?: number;
  quantity: number;
  commission: number;
  notes?: string;
  profitOrLoss?: number;
  rMultiple?: number;
  stopLoss?: number;
  takeProfit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AccountResponseDto {
  id: string;
  name: string;
  balance: number;
  currency: string;
  description: string;
  isActive: boolean;
  target: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
} 