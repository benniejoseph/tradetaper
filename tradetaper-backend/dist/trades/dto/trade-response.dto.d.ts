import { AssetType, TradeDirection, TradeStatus } from '../../types/enums';
export declare class TradeResponseDto {
    id: string;
    userId: string;
    assetType: AssetType;
    symbol: string;
    side: TradeDirection;
    status: TradeStatus;
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
