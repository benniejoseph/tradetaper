import { ConfigService } from '@nestjs/config';
import MetaApi from 'metaapi.cloud-sdk';
export declare class MetaApiManagerService {
    private configService;
    private readonly logger;
    private metaApiAccounts;
    private apiInstances;
    constructor(configService: ConfigService);
    private initializeMetaApiAccounts;
    private loadAdditionalAccounts;
    assignMetaApiAccount(userId: string): {
        accountId: string;
        api: MetaApi;
    };
    releaseMetaApiAccount(accountId: string, userId: string): void;
    getMetaApiInstance(accountId: string): MetaApi;
    getAccountStats(): {
        id: string;
        currentUsers: number;
        maxUsers: number;
        utilizationPercent: number;
        isActive: boolean;
    }[];
    addMetaApiAccount(token: string, maxUsers?: number): Promise<string>;
    healthCheck(): Promise<any[]>;
}
