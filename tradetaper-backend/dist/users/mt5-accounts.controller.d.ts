import { MT5AccountsService } from './mt5-accounts.service';
import { CreateMT5AccountDto, CreateManualMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesService } from '../trades/trades.service';
export declare class MT5AccountsController {
    private readonly mt5AccountsService;
    private readonly tradeHistoryParserService;
    private readonly tradesService;
    constructor(mt5AccountsService: MT5AccountsService, tradeHistoryParserService: TradeHistoryParserService, tradesService: TradesService);
    create(req: any, createMT5AccountDto: CreateMT5AccountDto): Promise<MT5AccountResponseDto>;
    createManual(req: any, createMT5AccountDto: CreateManualMT5AccountDto): Promise<any>;
    findAll(req: any): Promise<MT5AccountResponseDto[]>;
    findOne(req: any, id: string): Promise<MT5AccountResponseDto>;
    getLiveTrades(): never[];
    getCandles(req: any, id: string, symbol: string, timeframe: string, startTimeStr: string, endTimeStr: string): Promise<any[]>;
    syncAccount(id: string): Promise<void>;
    remove(req: any, id: string): Promise<void>;
    linkAccount(req: any, id: string, body: {
        password: string;
    }): Promise<{
        success: boolean;
        message: string;
        metaApiAccountId: string;
        state: string;
    }>;
    unlinkAccount(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getConnectionStatus(req: any, id: string): Promise<{
        state: string;
        connectionStatus: string;
        deployed: boolean;
        metaApiAvailable: boolean;
    }>;
    importTrades(req: any, id: string, body: {
        fromDate: string;
        toDate: string;
    }): Promise<{
        imported: number;
        skipped: number;
        errors: number;
    }>;
    healthCheck(): {
        status: string;
        timestamp: string;
    };
    update(req: any, id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
}
