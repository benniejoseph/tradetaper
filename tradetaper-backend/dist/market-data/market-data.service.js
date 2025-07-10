"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MarketDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
function isPriceDataPoint(item) {
    return item !== null;
}
let MarketDataService = MarketDataService_1 = class MarketDataService {
    httpService;
    configService;
    logger = new common_1.Logger(MarketDataService_1.name);
    tradermadeApiKey;
    tradermadeApiBaseUrl = 'https://marketdata.tradermade.com/api/v1';
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
    }
    onModuleInit() {
        const apiKeyFromConfig = this.configService.get('TRADERMADE_API_KEY');
        if (!apiKeyFromConfig) {
            this.logger.warn('TRADERMADE_API_KEY is not configured. Market data will use fallback/mock data.');
            this.tradermadeApiKey = '';
        }
        else {
            this.tradermadeApiKey = apiKeyFromConfig;
            this.logger.log('MarketDataService initialized with Tradermade API Key.');
        }
    }
    async getTradermadeHistoricalData(currencyPair, startDate, endDate, interval) {
        if (!this.tradermadeApiKey) {
            throw new common_1.HttpException('Market data service not configured (API key missing)', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const isIntradayRequest = interval.includes('minute') || interval === 'hourly';
        if (isIntradayRequest) {
            this.logger.warn(`Intraday data requested (${interval}) but API key may not support it. Falling back to daily data.`);
            try {
                if (interval.includes('minute')) {
                    return await this.getMinuteHistoricalData(currencyPair, startDate, endDate, interval);
                }
                else if (interval === 'hourly') {
                    return await this.getHourlyHistoricalData(currencyPair, startDate, endDate);
                }
            }
            catch (error) {
                this.logger.warn(`Intraday data failed for ${currencyPair} (${interval}). Falling back to daily data.`);
                return this.getTimeseriesData(currencyPair, startDate, endDate, 'daily');
            }
        }
        return this.getTimeseriesData(currencyPair, startDate, endDate, interval);
    }
    async getMinuteHistoricalData(currencyPair, startDate, endDate, interval) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        if ((interval === '1minute' || interval === '5minute') && daysDiff > 2) {
            this.logger.warn(`Limiting date range for ${interval} data from ${daysDiff} days to 2 days due to Tradermade API limits`);
            const limitedEndDate = new Date(start);
            limitedEndDate.setDate(start.getDate() + 2);
            endDate = limitedEndDate.toISOString().split('T')[0];
        }
        if ((interval === '15minute' || interval === '30minute') && daysDiff > 5) {
            this.logger.warn(`Limiting date range for ${interval} data from ${daysDiff} days to 5 days due to Tradermade API limits`);
            const limitedEndDate = new Date(start);
            limitedEndDate.setDate(start.getDate() + 5);
            endDate = limitedEndDate.toISOString().split('T')[0];
        }
        const paramsObj = {
            currency: currencyPair,
            api_key: this.tradermadeApiKey,
            start_date: `${startDate}-00:00`,
            end_date: `${endDate}-23:59`,
            interval: 'minute',
            format: 'records',
        };
        if (interval === '1minute') {
            paramsObj.period = '1';
        }
        else if (interval === '5minute') {
            paramsObj.period = '5';
        }
        else if (interval === '15minute') {
            paramsObj.period = '15';
        }
        else if (interval === '30minute') {
            paramsObj.period = '30';
        }
        else {
            paramsObj.period = '15';
        }
        const params = new URLSearchParams(paramsObj);
        const url = `${this.tradermadeApiBaseUrl}/timeseries?${params.toString()}`;
        this.logger.log(`Fetching minute data for ${currencyPair} (Interval: ${interval}) from ${startDate} to ${endDate} from Tradermade. URL: ${url}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            return this.processTimeseriesResponse(response.data, currencyPair, interval);
        }
        catch (error) {
            return this.handleTradermadeError(error, currencyPair, interval);
        }
    }
    async getHourlyHistoricalData(currencyPair, startDate, endDate) {
        const paramsObj = {
            currency: currencyPair,
            api_key: this.tradermadeApiKey,
            start_date: `${startDate}-00:00`,
            end_date: `${endDate}-23:00`,
            interval: 'hourly',
            period: '1',
            format: 'records',
        };
        const params = new URLSearchParams(paramsObj);
        const url = `${this.tradermadeApiBaseUrl}/timeseries?${params.toString()}`;
        this.logger.log(`Fetching hourly data for ${currencyPair} from ${startDate} to ${endDate} from Tradermade. URL: ${url}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            return this.processTimeseriesResponse(response.data, currencyPair, 'hourly');
        }
        catch (error) {
            return this.handleTradermadeError(error, currencyPair, 'hourly');
        }
    }
    async getTimeseriesData(currencyPair, startDate, endDate, interval) {
        const paramsObj = {
            currency: currencyPair,
            api_key: this.tradermadeApiKey,
            start_date: startDate,
            end_date: endDate,
            format: 'records',
        };
        if (interval !== 'daily') {
            paramsObj.interval = interval;
        }
        const params = new URLSearchParams(paramsObj);
        const url = `${this.tradermadeApiBaseUrl}/timeseries?${params.toString()}`;
        this.logger.log(`Fetching timeseries data for ${currencyPair} (Interval: ${interval}) from ${startDate} to ${endDate} from Tradermade. URL: ${url}`);
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            return this.processTimeseriesResponse(response.data, currencyPair, interval);
        }
        catch (error) {
            return this.handleTradermadeError(error, currencyPair, interval);
        }
    }
    processTimeseriesResponse(data, currencyPair, interval) {
        if (data &&
            (data.error ||
                data.errors ||
                (data.message && data.message.toLowerCase().includes('invalid')))) {
            const errorMessage = data.message ||
                data.error ||
                JSON.stringify(data.errors) ||
                'Unknown Tradermade API error';
            this.logger.error(`Tradermade API Error for ${currencyPair} (${interval}): ${errorMessage}`);
            throw new common_1.HttpException(`Tradermade API Error: ${errorMessage}`, common_1.HttpStatus.BAD_REQUEST);
        }
        let quotes = [];
        if (data && Array.isArray(data)) {
            quotes = data;
        }
        else if (data && data.quotes && Array.isArray(data.quotes)) {
            quotes = data.quotes;
        }
        else {
            this.logger.warn(`Unexpected response structure from Tradermade for ${currencyPair} (${interval}):`, data);
            return [];
        }
        if (quotes.length === 0) {
            this.logger.warn(`Tradermade returned no quotes for ${currencyPair} (${interval})`);
            return [];
        }
        const priceData = quotes
            .map((q) => {
            const dateField = q.date || q.date_time;
            if (!dateField ||
                q.open == null ||
                q.high == null ||
                q.low == null ||
                q.close == null) {
                this.logger.warn('Skipping incomplete quote data point:', q);
                return null;
            }
            try {
                const timestamp = new Date(dateField).getTime() / 1000;
                if (isNaN(timestamp)) {
                    this.logger.warn('Invalid date in quote:', dateField);
                    return null;
                }
                return {
                    time: timestamp,
                    open: parseFloat(q.open),
                    high: parseFloat(q.high),
                    low: parseFloat(q.low),
                    close: parseFloat(q.close),
                };
            }
            catch (error) {
                this.logger.warn('Error processing quote date:', dateField, error);
                return null;
            }
        })
            .filter(isPriceDataPoint)
            .sort((a, b) => a.time - b.time);
        this.logger.log(`Successfully processed ${priceData.length} data points for ${currencyPair} (${interval})`);
        return priceData;
    }
    handleTradermadeError(error, currencyPair, interval) {
        this.logger.error(`Failed to fetch Tradermade data for ${currencyPair} (${interval}): ${error.message}`, error.stack);
        if (error instanceof common_1.HttpException) {
            throw error;
        }
        if (error.response) {
            this.logger.error(`Tradermade API HTTP Error Status: ${error.response.status}`);
            this.logger.error(`Tradermade API HTTP Error Data: ${JSON.stringify(error.response.data)}`);
            const apiErrorMessage = error.response.data?.message ||
                error.response.data?.error ||
                error.response.statusText;
            if (error.response.status === 403) {
                if (apiErrorMessage?.includes('working days')) {
                    throw new common_1.HttpException(`Tradermade API limit: ${apiErrorMessage}. Try selecting a shorter date range or higher timeframe.`, common_1.HttpStatus.BAD_REQUEST);
                }
                else if (apiErrorMessage?.includes('one month history')) {
                    throw new common_1.HttpException(`Historical data access limited: ${apiErrorMessage}. Your API plan may not support ${interval} data. Please upgrade your Tradermade subscription or use daily data.`, common_1.HttpStatus.FORBIDDEN);
                }
                else {
                    throw new common_1.HttpException(`Tradermade API access denied: ${apiErrorMessage}. Your API plan may not support ${interval} data.`, common_1.HttpStatus.FORBIDDEN);
                }
            }
            throw new common_1.HttpException(`Tradermade API HTTP error: ${apiErrorMessage}`, error.response.status);
        }
        throw new common_1.HttpException(`Failed to fetch market data for ${currencyPair}`, common_1.HttpStatus.SERVICE_UNAVAILABLE);
    }
};
exports.MarketDataService = MarketDataService;
exports.MarketDataService = MarketDataService = MarketDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], MarketDataService);
//# sourceMappingURL=market-data.service.js.map