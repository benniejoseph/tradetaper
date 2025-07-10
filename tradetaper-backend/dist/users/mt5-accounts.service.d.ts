import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { CreateMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ConfigService } from '@nestjs/config';
import { MetaApiService } from './metaapi.service';
export declare class MT5AccountsService {
    private readonly mt5AccountRepository;
    private readonly configService;
    private readonly metaApiService;
    private readonly logger;
    private readonly encryptionKey;
    private readonly encryptionIV;
    constructor(mt5AccountRepository: Repository<MT5Account>, configService: ConfigService, metaApiService: MetaApiService);
    private encrypt;
    private decrypt;
    create(createMT5AccountDto: CreateMT5AccountDto, user: UserResponseDto): Promise<MT5AccountResponseDto>;
    createManual(manualAccountData: any): Promise<any>;
    findAllByUser(userId: string): Promise<MT5AccountResponseDto[]>;
    findOne(id: string): Promise<MT5Account | null>;
    update(id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
    remove(id: string): Promise<void>;
    syncAccount(id: string): Promise<MT5AccountResponseDto>;
    validateMT5Connection(login: string, password: string, server: string): Promise<boolean>;
    importTradesFromMT5(accountId: string, fromDate: Date, toDate: Date): Promise<any[]>;
    private mapToResponseDto;
    private cleanupCorruptedAccounts;
}
