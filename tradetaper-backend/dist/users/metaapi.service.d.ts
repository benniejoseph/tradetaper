import { ConfigService } from '@nestjs/config';
import { MetatraderAccountInformation, MetatraderDeal, MetatraderPosition, MetatraderOrder, StreamingMetaApiConnectionInstance } from 'metaapi.cloud-sdk';
import { Repository } from 'typeorm';
import { MT5Account } from './entities/mt5-account.entity';
import { User } from './entities/user.entity';
export interface MT5AccountCredentials {
    accountName: string;
    server: string;
    login: string;
    password: string;
    isRealAccount: boolean;
}
export interface HistoricalTradeFilter {
    startDate?: string;
    endDate?: string;
    limit?: number;
}
export interface LiveTradeData {
    positions: MetatraderPosition[];
    orders: MetatraderOrder[];
    accountInfo: MetatraderAccountInformation;
    deals: MetatraderDeal[];
}
export declare class MetaApiService {
    private configService;
    private mt5AccountRepository;
    private userRepository;
    private readonly logger;
    private metaApi;
    constructor(configService: ConfigService, mt5AccountRepository: Repository<MT5Account>, userRepository: Repository<User>);
    private initializeMetaApi;
    getAvailableServers(): Promise<Array<{
        name: string;
        type: string;
    }>>;
    private getProvisioningProfile;
    addMT5Account(userId: string, credentials: MT5AccountCredentials): Promise<MT5Account>;
    connectAccount(accountId: string): Promise<void>;
    getHistoricalTrades(accountId: string, filter?: HistoricalTradeFilter): Promise<MetatraderDeal[]>;
    getLiveTradeData(accountId: string): Promise<LiveTradeData>;
    startStreaming(accountId: string): Promise<StreamingMetaApiConnectionInstance>;
    stopStreaming(accountId: string): Promise<void>;
    removeMT5Account(accountId: string, userId: string): Promise<void>;
    getAccountStatus(accountId: string): Promise<{
        isConnected: boolean;
        isStreaming: boolean;
        deploymentState: string;
        connectionState: string;
        lastHeartbeat?: Date;
        lastError?: string;
    }>;
    healthCheck(): Promise<{
        status: string;
        message: string;
        details?: any;
    }>;
}
