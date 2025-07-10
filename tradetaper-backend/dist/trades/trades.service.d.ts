import { Repository, FindManyOptions } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { SimpleTradesGateway } from '../websocket/simple-trades.gateway';
export declare class TradesService {
    private readonly tradesRepository;
    private readonly tagRepository;
    private readonly tradesGateway;
    private readonly logger;
    constructor(tradesRepository: Repository<Trade>, tagRepository: Repository<Tag>, tradesGateway: SimpleTradesGateway);
    private calculateAndSetPnl;
    private findOrCreateTags;
    create(createTradeDto: CreateTradeDto, userContext: UserResponseDto): Promise<Trade>;
    findAll(userContext: UserResponseDto, accountId?: string, options?: FindManyOptions<Trade>): Promise<Trade[]>;
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
