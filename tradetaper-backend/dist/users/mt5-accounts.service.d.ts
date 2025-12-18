import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { CreateMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { UserResponseDto } from './dto/user-response.dto';
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
    create(createMT5AccountDto: CreateMT5AccountDto, user: UserResponseDto): Promise<MT5AccountResponseDto>;
    createManual(manualAccountData: any): Promise<any>;
    findAllByUser(userId: string): Promise<MT5AccountResponseDto[]>;
    findOne(id: string): Promise<MT5Account | null>;
    syncAccount(id: string): Promise<void>;
    importTradesFromMT5(id: string, fromDate: string, toDate: string): Promise<void>;
    update(id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
    remove(id: string): Promise<void>;
    private mapToResponseDto;
    private cleanupCorruptedAccounts;
}
