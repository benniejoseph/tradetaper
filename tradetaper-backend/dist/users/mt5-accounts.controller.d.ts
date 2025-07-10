import { MT5AccountsService } from './mt5-accounts.service';
import { CreateMT5AccountDto, CreateManualMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesService } from '../trades/trades.service';
import { MetaApiService } from './metaapi.service';
export declare class MT5AccountsController {
    private readonly mt5AccountsService;
    private readonly tradeHistoryParserService;
    private readonly tradesService;
    private readonly metaApiService;
    constructor(mt5AccountsService: MT5AccountsService, tradeHistoryParserService: TradeHistoryParserService, tradesService: TradesService, metaApiService: MetaApiService);
    create(req: any, createMT5AccountDto: CreateMT5AccountDto): Promise<MT5AccountResponseDto>;
    createManual(req: any, createMT5AccountDto: CreateManualMT5AccountDto): Promise<any>;
    findAll(req: any): Promise<MT5AccountResponseDto[]>;
    getAvailableServers(): Promise<{
        name: string;
        type: string;
    }[]>;
    findOne(req: any, id: string): Promise<MT5AccountResponseDto>;
    getAccountStatus(id: string): Promise<{
        isConnected: boolean;
        isStreaming: boolean;
        deploymentState: string;
        connectionState: string;
        lastHeartbeat?: Date;
        lastError?: string;
    }>;
    getHistoricalTrades(id: string, startDate?: string, endDate?: string, limit?: string): Promise<import("metaapi.cloud-sdk").MetatraderDeal[]>;
    getLiveTrades(id: string): Promise<never[]>;
    connectAccount(id: string): Promise<{
        message: string;
        status: string;
    }>;
    startStreaming(id: string): Promise<{
        message: string;
        status: string;
    }>;
    stopStreaming(id: string): Promise<{
        message: string;
        status: string;
    }>;
    syncAccount(req: any, id: string): Promise<MT5AccountResponseDto>;
    remove(req: any, id: string): Promise<void>;
    importTrades(req: any, id: string, fromDate: string, toDate: string): Promise<void>;
    reconnectAccount(req: any, id: string): Promise<{
        message: string;
        status: string;
    }>;
    healthCheck(): Promise<{
        status: string;
        message: string;
        timestamp: string;
    }>;
    update(req: any, id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
}
