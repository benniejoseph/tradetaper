import { PriceDataPoint } from './market-data.service';
import { MultiProviderMarketDataService } from './multi-provider.service';
export declare class MarketDataController {
    private readonly multiProviderService;
    private readonly logger;
    constructor(multiProviderService: MultiProviderMarketDataService);
    getForexHistoricalData(baseCurrency: string, quoteCurrency: string, startDate: string, endDate: string, interval: string): Promise<PriceDataPoint[]>;
    getCommoditiesHistoricalData(symbol: string, startDate: string, endDate: string, interval: string): Promise<PriceDataPoint[]>;
    getStocksHistoricalData(symbol: string, startDate: string, endDate: string, interval: string): Promise<PriceDataPoint[]>;
    getCryptoHistoricalData(symbol: string, startDate: string, endDate: string, interval: string): Promise<PriceDataPoint[]>;
    private getHistoricalDataForAssetType;
}
