import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Cache } from 'cache-manager';
import { MarketDataService } from './market-data.service';
export interface MarketDataProvider {
    name: string;
    priority: number;
    supports: string[];
    rateLimit: number;
    isActive: boolean;
}
export interface PriceQuote {
    symbol: string;
    bid: number;
    ask: number;
    last: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: Date;
    provider: string;
}
export interface HistoricalPrice {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface MarketDataResponse {
    success: boolean;
    data?: PriceQuote | HistoricalPrice[];
    error?: string;
    provider: string;
    cached: boolean;
}
export declare class MultiProviderMarketDataService {
    private readonly configService;
    private readonly httpService;
    private readonly marketDataService;
    private cacheManager;
    private readonly logger;
    private readonly providers;
    private requestCounts;
    constructor(configService: ConfigService, httpService: HttpService, marketDataService: MarketDataService, cacheManager: Cache);
    getRealTimePrice(symbol: string, assetType: string): Promise<MarketDataResponse>;
    getHistoricalPrices(symbol: string, assetType: string, interval?: string, fromDate?: Date, toDate?: Date): Promise<MarketDataResponse>;
    private fetchPriceFromProvider;
    private fetchHistoricalFromProvider;
    private fetchFromTraderMade;
    private fetchFromAlphaVantage;
    private fetchFromIEXCloud;
    private fetchFromYahooFinance;
    private fetchFromCoinGecko;
    private fetchHistoricalFromAlphaVantage;
    private fetchHistoricalFromYahooFinance;
    private fetchHistoricalFromIEXCloud;
    private canMakeRequest;
    private incrementRequestCount;
    getProviderStatus(): any;
    private fetchHistoricalFromTraderMade;
    testAllProviders(): Promise<any[]>;
}
