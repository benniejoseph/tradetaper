import { Repository, FindManyOptions } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { SimpleTradesGateway } from '../websocket/simple-trades.gateway';
import { GeminiVisionService } from '../notes/gemini-vision.service';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { AccountsService } from '../users/accounts.service';
import { MT5AccountsService } from '../users/mt5-accounts.service';
import { TradeCandle } from './entities/trade-candle.entity';
import { TerminalFarmService } from '../terminal-farm/terminal-farm.service';
export declare class TradesService {
    private readonly tradesRepository;
    private readonly tradeCandleRepository;
    private readonly tagRepository;
    private readonly tradesGateway;
    private readonly geminiVisionService;
    private readonly accountsService;
    private readonly mt5AccountsService;
    private readonly terminalFarmService;
    private readonly logger;
    constructor(tradesRepository: Repository<Trade>, tradeCandleRepository: Repository<TradeCandle>, tagRepository: Repository<Tag>, tradesGateway: SimpleTradesGateway, geminiVisionService: GeminiVisionService, accountsService: AccountsService, mt5AccountsService: MT5AccountsService, terminalFarmService: TerminalFarmService);
    getTradeCandles(tradeId: string, timeframe: string, userContext: UserResponseDto): Promise<any[]>;
    saveExecutionCandles(tradeId: string, candles: any[]): Promise<void>;
    private _populateAccountDetails;
    private findOrCreateTags;
    create(createTradeDto: CreateTradeDto, userContext: UserResponseDto): Promise<Trade>;
    findAllByUser(userId: string): Promise<Trade[]>;
    findAll(userContext: UserResponseDto, accountId?: string, options?: FindManyOptions<Trade>, page?: number, limit?: number): Promise<PaginatedResponseDto<Trade>>;
    findDuplicate(userId: string, symbol: string, entryDate: Date, externalId?: string): Promise<Trade | null>;
    findOneByExternalId(userId: string, externalId: string): Promise<Trade | null>;
    findOne(id: string, userContext: UserResponseDto): Promise<Trade>;
    update(id: string, updateTradeDto: UpdateTradeDto, userContext: UserResponseDto): Promise<Trade>;
    remove(id: string, userContext: UserResponseDto): Promise<void>;
    bulkDelete(tradeIds: string[], userContext: UserResponseDto): Promise<{
        deletedCount: number;
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
