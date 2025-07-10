import { OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export interface PriceDataPoint {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}
export declare class MarketDataService implements OnModuleInit {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private tradermadeApiKey;
    private readonly tradermadeApiBaseUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    onModuleInit(): void;
    getTradermadeHistoricalData(currencyPair: string, startDate: string, endDate: string, interval: string): Promise<PriceDataPoint[]>;
    private getMinuteHistoricalData;
    private getHourlyHistoricalData;
    private getTimeseriesData;
    private processTimeseriesResponse;
    private handleTradermadeError;
}
