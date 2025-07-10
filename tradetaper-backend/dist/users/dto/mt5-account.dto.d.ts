export declare class CreateMT5AccountDto {
    accountName: string;
    server: string;
    login: string;
    password: string;
    accountType?: string;
    currency?: string;
    isActive?: boolean;
    isRealAccount?: boolean;
}
export declare class CreateManualMT5AccountDto {
    accountName: string;
    server?: string;
    login?: string;
    accountType?: string;
    currency?: string;
    isActive?: boolean;
    isRealAccount?: boolean;
}
export declare class UpdateMT5AccountDto {
    accountName?: string;
    server?: string;
    login?: string;
    password?: string;
    accountType?: string;
    currency?: string;
    isActive?: boolean;
}
export declare class MT5AccountResponseDto {
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
