import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { CreateMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { ConfigService } from '@nestjs/config';
import { TradesService } from '../trades/trades.service';
import { User } from './entities/user.entity';
import { MetaApiService } from '../integrations/metaapi/metaapi.service';
import { TradeMapperService } from '../integrations/metaapi/trade-mapper.service';
import { TradeJournalSyncService } from '../trades/services/trade-journal-sync.service';
export declare class MT5AccountsService {
    private readonly mt5AccountRepository;
    private readonly userRepository;
    private readonly configService;
    private readonly tradesService;
    private readonly metaApiService;
    private readonly tradeMapperService;
    private readonly tradeJournalSyncService;
    private readonly logger;
    private readonly encryptionKey;
    private readonly encryptionIV;
    constructor(mt5AccountRepository: Repository<MT5Account>, userRepository: Repository<User>, configService: ConfigService, tradesService: TradesService, metaApiService: MetaApiService, tradeMapperService: TradeMapperService, tradeJournalSyncService: TradeJournalSyncService);
    private encrypt;
    private decrypt;
    isMetaApiAvailable(): boolean;
    create(createDto: CreateMT5AccountDto, userId: string): Promise<MT5AccountResponseDto>;
    linkAccount(id: string, credentials: {
        password: string;
    }): Promise<{
        accountId: string;
        state: string;
    }>;
    unlinkAccount(id: string): Promise<void>;
    getConnectionStatus(id: string): Promise<{
        state: string;
        connectionStatus: string;
        deployed: boolean;
        metaApiAvailable: boolean;
    }>;
    syncAccount(id: string): Promise<void>;
    importTradesFromMT5(id: string, fromDate: string, toDate: string): Promise<{
        imported: number;
        skipped: number;
        errors: number;
    }>;
    createManual(manualAccountData: any): Promise<any>;
    findAllByUser(userId: string): Promise<MT5AccountResponseDto[]>;
    findOne(id: string): Promise<MT5Account | null>;
    update(id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
    remove(id: string): Promise<void>;
    private mapToResponseDto;
    private cleanupCorruptedAccounts;
    private ensureAccountDeployed;
}
