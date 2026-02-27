import { MT5AccountsService } from './mt5-accounts.service';
import { CreateMT5AccountDto, CreateManualMT5AccountDto, UpdateMT5AccountDto, MT5AccountResponseDto } from './dto/mt5-account.dto';
export declare class MT5AccountsController {
    private readonly mt5AccountsService;
    constructor(mt5AccountsService: MT5AccountsService);
    create(req: any, createMT5AccountDto: CreateMT5AccountDto): Promise<MT5AccountResponseDto>;
    createManual(req: any, createMT5AccountDto: CreateManualMT5AccountDto): Promise<Record<string, any>>;
    findAll(req: any): Promise<MT5AccountResponseDto[]>;
    getServers(query: string): Promise<{
        name: string;
        broker?: string;
        type?: string;
    }[]>;
    findOne(req: any, id: string): Promise<MT5AccountResponseDto>;
    getLiveTrades(): never[];
    syncMetaApiAccount(req: any, id: string): Promise<{
        imported: number;
        skipped: number;
        failed: number;
    }>;
    disconnectMetaApiAccount(req: any, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    setDefaultAccount(req: any, id: string): Promise<MT5AccountResponseDto>;
    remove(req: any, id: string): Promise<void>;
    getConnectionStatus(req: any, id: string): Promise<{
        state: string;
        connectionStatus: string;
        deployed: boolean;
        autoSyncEnabled: boolean;
        isStreamingActive: boolean;
        lastSyncAt?: Date;
        lastSyncError?: string;
    }>;
    healthCheck(): {
        status: string;
        syncMethod: string;
        timestamp: string;
    };
    update(req: any, id: string, updateMT5AccountDto: UpdateMT5AccountDto): Promise<MT5AccountResponseDto>;
}
