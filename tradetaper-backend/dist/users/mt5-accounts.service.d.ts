import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { CreateMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { ConfigService } from '@nestjs/config';
import { TradesService } from '../trades/trades.service';
import { User } from './entities/user.entity';
export declare class MT5AccountsService {
    private readonly mt5AccountRepository;
    private readonly userRepository;
    private readonly configService;
    private readonly tradesService;
    private readonly logger;
    private readonly encryptionKey;
    private readonly encryptionIV;
    constructor(mt5AccountRepository: Repository<MT5Account>, userRepository: Repository<User>, configService: ConfigService, tradesService: TradesService);
    private encrypt;
    private decrypt;
    create(createDto: CreateMT5AccountDto, userId: string): Promise<MT5AccountResponseDto>;
    createManual(manualAccountData: Record<string, any>): Promise<Record<string, any>>;
    findAllByUser(userId: string): Promise<MT5AccountResponseDto[]>;
    findOne(id: string): Promise<MT5Account | null>;
    update(id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
    remove(id: string): Promise<void>;
    private mapToResponseDto;
    syncAccount(id: string): Promise<void>;
    getConnectionStatus(id: string): Promise<{
        state: string;
        connectionStatus: string;
        deployed: boolean;
        ftpConfigured: boolean;
    }>;
}
