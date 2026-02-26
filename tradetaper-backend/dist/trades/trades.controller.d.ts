import { TradesService } from './trades.service';
import { PerformanceService } from './performance.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { GroupTradesDto } from './dto/group-trades.dto';
import { CopyJournalDto } from './dto/copy-journal.dto';
import { Trade } from './entities/trade.entity';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
export declare class TradesController {
    private readonly tradesService;
    private readonly performanceService;
    private readonly logger;
    constructor(tradesService: TradesService, performanceService: PerformanceService);
    create(createTradeDto: CreateTradeDto, req: any): Promise<Trade>;
    findAll(req: any, accountId?: string, page?: number, limit?: number): Promise<PaginatedResponseDto<Trade>>;
    findAllLite(req: any, accountId?: string, page?: number, limit?: number, includeTags?: string, status?: string, direction?: string, assetType?: string, symbol?: string, search?: string, dateFrom?: string, dateTo?: string, isStarred?: string, minPnl?: string, maxPnl?: string, minDuration?: string, maxDuration?: string, sortBy?: string, sortDir?: string): Promise<PaginatedResponseDto<Trade>>;
    getSummary(req: any, accountId?: string, dateFrom?: string, dateTo?: string, status?: string, direction?: string, assetType?: string, symbol?: string, search?: string, isStarred?: string, minPnl?: string, maxPnl?: string, minDuration?: string, maxDuration?: string): Promise<import("./performance.service").PerformanceMetrics>;
    findOne(id: string, req: any): Promise<Trade>;
    getCandles(id: string, timeframe: string, req: any): Promise<any[]>;
    parseVoiceJournal(file: Express.Multer.File, req: any): Promise<import("./dto/voice-journal.dto").VoiceJournalResponseDto>;
    groupTrades(groupTradesDto: GroupTradesDto, req: any): Promise<{
        groupId: string;
        updatedCount: number;
    }>;
    bulkDelete(body: {
        tradeIds: string[];
    }, req: any): Promise<{
        deletedCount: number;
    }>;
    bulkUpdate(body: {
        updates: {
            id: string;
            data: Partial<UpdateTradeDto>;
        }[];
    }, req: any): Promise<{
        updatedCount: number;
        trades: Trade[];
    }>;
    copyJournalToGroup(id: string, copyJournalDto: CopyJournalDto, req: any): Promise<{
        updatedCount: number;
    }>;
    update(id: string, updateTradeDto: UpdateTradeDto, req: any): Promise<Trade>;
    remove(id: string, req: any): Promise<void>;
    bulkImport(body: {
        trades: CreateTradeDto[];
    }, req: any): Promise<{
        importedCount: number;
        trades: Trade[];
    }>;
    mergeDuplicates(req: any, accountId?: string): Promise<{
        merged: number;
        totalDuplicates: number;
    }>;
}
