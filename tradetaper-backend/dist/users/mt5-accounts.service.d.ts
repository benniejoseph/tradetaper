import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { CreateMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { ConfigService } from '@nestjs/config';
import { TradesService } from '../trades/trades.service';
import { User } from './entities/user.entity';
import { MetaApiService } from './metaapi.service';
export declare class MT5AccountsService {
    private readonly mt5AccountRepository;
    private readonly userRepository;
    private readonly configService;
    private readonly tradesService;
    private readonly metaApiService;
    private readonly logger;
    private readonly encryptionKey;
    private readonly encryptionIV;
    constructor(mt5AccountRepository: Repository<MT5Account>, userRepository: Repository<User>, configService: ConfigService, tradesService: TradesService, metaApiService: MetaApiService);
    private readonly metaApiListeners;
    private encrypt;
    private decrypt;
    create(createDto: CreateMT5AccountDto, userId: string): Promise<MT5AccountResponseDto>;
    createManual(manualAccountData: Record<string, any>): Promise<Record<string, any>>;
    findAllByUser(userId: string): Promise<MT5AccountResponseDto[]>;
    getMetaApiServers(query: string): Promise<Array<{
        name: string;
        broker?: string;
        type?: string;
    }>>;
    findOne(id: string): Promise<MT5Account | null>;
    update(id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
    syncMetaApiAccount(accountId: string, options?: {
        fullHistory?: boolean;
        startStreaming?: boolean;
    }): Promise<{
        imported: number;
        skipped: number;
        failed: number;
    }>;
    remove(id: string): Promise<void>;
    private updateAccountInfo;
    private ensureMetaApiListener;
    private syncOpenPositionsFromMetaApi;
    private syncMetaApiPosition;
    private processMetaApiDealsBatch;
    private processMetaApiDeal;
    private isSupportedDealType;
    private mapDealSide;
    private getContractSize;
    private detectAssetType;
    private mapToResponseDto;
    getConnectionStatus(id: string): Promise<{
        state: string;
        connectionStatus: string;
        deployed: boolean;
        autoSyncEnabled: boolean;
        isStreamingActive: boolean;
        lastSyncAt?: Date;
        lastSyncError?: string;
    }>;
}
