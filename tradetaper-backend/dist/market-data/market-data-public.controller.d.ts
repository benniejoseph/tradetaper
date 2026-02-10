import { MultiProviderMarketDataService } from './multi-provider.service';
export declare class MarketDataPublicController {
    private readonly multiProviderService;
    private readonly logger;
    constructor(multiProviderService: MultiProviderMarketDataService);
    getProviderStatus(): Promise<Record<string, unknown>[]>;
    testProviders(): Promise<any[]>;
}
