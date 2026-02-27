import { Repository, FindManyOptions } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { GroupTradesDto } from './dto/group-trades.dto';
import { CopyJournalDto } from './dto/copy-journal.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { SimpleTradesGateway } from '../websocket/simple-trades.gateway';
import { GeminiVisionService } from '../notes/gemini-vision.service';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { AccountsService } from '../users/accounts.service';
import { MT5AccountsService } from '../users/mt5-accounts.service';
import { TradeCandle } from './entities/trade-candle.entity';
import { TerminalFarmService } from '../terminal-farm/terminal-farm.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MultiModelOrchestratorService } from '../agents/llm/multi-model-orchestrator.service';
import { VoiceJournalResponseDto } from './dto/voice-journal.dto';
import { CandleManagementService } from '../backtesting/services/candle-management.service';
export declare class TradesService {
    private readonly tradesRepository;
    private readonly tradeCandleRepository;
    private readonly tagRepository;
    private readonly tradesGateway;
    private readonly geminiVisionService;
    private readonly accountsService;
    private readonly mt5AccountsService;
    private readonly terminalFarmService;
    private readonly notificationsService;
    private readonly orchestratorService;
    private readonly candleManagementService;
    private readonly logger;
    constructor(tradesRepository: Repository<Trade>, tradeCandleRepository: Repository<TradeCandle>, tagRepository: Repository<Tag>, tradesGateway: SimpleTradesGateway, geminiVisionService: GeminiVisionService, accountsService: AccountsService, mt5AccountsService: MT5AccountsService, terminalFarmService: TerminalFarmService, notificationsService: NotificationsService, orchestratorService: MultiModelOrchestratorService, candleManagementService: CandleManagementService);
    parseVoiceJournal(audioBuffer: Buffer, mimeType: string, userContext: UserResponseDto): Promise<VoiceJournalResponseDto>;
    getTradeCandles(tradeId: string, _timeframe: string, userContext: UserResponseDto): Promise<any[]>;
    saveExecutionCandles(tradeId: string, candles: any[]): Promise<void>;
    private _populateAccountDetails;
    private findOrCreateTags;
    create(createTradeDto: CreateTradeDto, userContext: UserResponseDto): Promise<Trade>;
    findAllByUser(userId: string): Promise<Trade[]>;
    findAll(userContext: UserResponseDto, accountId?: string, options?: FindManyOptions<Trade>, page?: number, limit?: number): Promise<PaginatedResponseDto<Trade>>;
    findAllLite(userContext: UserResponseDto, accountId?: string, page?: number, limit?: number, includeTags?: boolean, filters?: {
        status?: string;
        direction?: string;
        assetType?: string;
        symbol?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        isStarred?: boolean;
        minPnl?: number;
        maxPnl?: number;
        minDuration?: number;
        maxDuration?: number;
        sortBy?: string;
        sortDir?: string;
    }): Promise<PaginatedResponseDto<Trade>>;
    findDuplicate(userId: string, symbol: string, entryDate: Date, externalId?: string): Promise<Trade | null>;
    findOneByExternalId(userId: string, externalId: string, accountId?: string): Promise<Trade | null>;
    findManyByExternalIds(userId: string, externalIds: string[], accountId?: string): Promise<Trade[]>;
    findOpenTradeBySymbolAndTime(userId: string, accountId: string, symbol: string, nearOpenTime: Date, toleranceSec?: number): Promise<Trade | null>;
    orphanTradesByAccount(accountId: string): Promise<void>;
    mergeDuplicateExternalTrades(userId: string, externalId: string, accountId?: string): Promise<Trade | null>;
    mergeDuplicateExternalTradesForUser(userId: string, accountId?: string): Promise<{
        merged: number;
        totalDuplicates: number;
    }>;
    private mergeTradeRecords;
    findOne(id: string, userContext: UserResponseDto): Promise<Trade>;
    private normalizeChangeValue;
    private buildChangeLogEntry;
    update(id: string, updateTradeDto: UpdateTradeDto, userContext: UserResponseDto, options?: {
        logChanges?: boolean;
        changeSource?: 'user' | 'mt5' | 'system';
    }): Promise<Trade>;
    updateFromSync(id: string, updateData: Partial<Trade>, changeLog?: {
        source: 'mt5' | 'system' | 'user';
        changes: Record<string, {
            from: unknown;
            to: unknown;
        }>;
        note?: string;
    }): Promise<Trade>;
    remove(id: string, userContext: UserResponseDto): Promise<void>;
    bulkDelete(tradeIds: string[], userContext: UserResponseDto): Promise<{
        deletedCount: number;
    }>;
    groupTrades(groupTradesDto: GroupTradesDto, userContext: UserResponseDto): Promise<{
        groupId: string;
        updatedCount: number;
    }>;
    copyJournalToGroup(id: string, copyJournalDto: CopyJournalDto, userContext: UserResponseDto): Promise<{
        updatedCount: number;
    }>;
    bulkUpdate(updates: {
        id: string;
        data: Partial<UpdateTradeDto>;
    }[], userContext: UserResponseDto): Promise<{
        updatedCount: number;
        trades: Trade[];
    }>;
    bulkImport(trades: CreateTradeDto[], userContext: UserResponseDto): Promise<{
        importedCount: number;
        trades: Trade[];
    }>;
}
