import { MT5AccountsService } from './mt5-accounts.service';
import { CreateManualMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { TradeHistoryParserService } from './trade-history-parser.service';
import { TradesService } from '../trades/trades.service';
export declare class MT5AccountsController {
    private readonly mt5AccountsService;
    private readonly tradeHistoryParserService;
    private readonly tradesService;
    constructor(mt5AccountsService: MT5AccountsService, tradeHistoryParserService: TradeHistoryParserService, tradesService: TradesService);
    createManual(req: any, createMT5AccountDto: CreateManualMT5AccountDto): Promise<any>;
    findAll(req: any): Promise<MT5AccountResponseDto[]>;
    findOne(req: any, id: string): Promise<MT5AccountResponseDto>;
    getLiveTrades(): never[];
    syncAccount(id: string): Promise<void>;
    remove(req: any, id: string): Promise<void>;
    importTrades(req: any, id: string, body: {
        fromDate: string;
        toDate: string;
    }): Promise<void>;
    healthCheck(): {
        status: string;
        timestamp: string;
    };
    update(req: any, id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
}
