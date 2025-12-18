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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MultiProviderMarketDataService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiProviderMarketDataService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const cache_manager_1 = require("@nestjs/cache-manager");
const market_data_service_1 = require("./market-data.service");
let MultiProviderMarketDataService = MultiProviderMarketDataService_1 = class MultiProviderMarketDataService {
    configService;
    httpService;
    marketDataService;
    cacheManager;
    logger = new common_1.Logger(MultiProviderMarketDataService_1.name);
    providers = [
        {
            name: 'tradermade',
            priority: 1,
            supports: ['forex', 'commodities'],
            rateLimit: 100,
            isActive: true,
        },
        {
            name: 'alphaVantage',
            priority: 2,
            supports: ['stocks', 'forex', 'crypto'],
            rateLimit: 5,
            isActive: true,
        },
        {
            name: 'iexCloud',
            priority: 3,
            supports: ['stocks'],
            rateLimit: 100,
            isActive: true,
        },
        {
            name: 'yahooFinance',
            priority: 4,
            supports: ['stocks', 'forex', 'crypto', 'commodities'],
            rateLimit: 2000,
            isActive: true,
        },
        {
            name: 'coinGecko',
            priority: 5,
            supports: ['crypto'],
            rateLimit: 50,
            isActive: true,
        },
    ];
    requestCounts = new Map();
    constructor(configService, httpService, marketDataService, cacheManager) {
        this.configService = configService;
        this.httpService = httpService;
        this.marketDataService = marketDataService;
        this.cacheManager = cacheManager;
    }
    async getRealTimePrice(symbol, assetType) {
        const cacheKey = `price:${symbol}:${assetType}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                provider: cached.provider,
                cached: true,
            };
        }
        const suitableProviders = this.providers
            .filter((p) => p.isActive && p.supports.includes(assetType))
            .sort((a, b) => a.priority - b.priority);
        for (const provider of suitableProviders) {
            if (!this.canMakeRequest(provider.name, provider.rateLimit)) {
                this.logger.warn(`Rate limit exceeded for provider ${provider.name}`);
                continue;
            }
            try {
                const result = await this.fetchPriceFromProvider(provider.name, symbol, assetType);
                if (result.success && result.data) {
                    await this.cacheManager.set(cacheKey, result.data, 30000);
                    this.incrementRequestCount(provider.name);
                    return { ...result, cached: false };
                }
            }
            catch (error) {
                this.logger.error(`Error fetching from ${provider.name}: ${error.message}`);
                continue;
            }
        }
        return {
            success: false,
            error: 'No providers available or all providers failed',
            provider: 'none',
            cached: false,
        };
    }
    async getHistoricalPrices(symbol, assetType, interval = '1day', fromDate, toDate) {
        const cacheKey = `history:${symbol}:${assetType}:${interval}:${fromDate?.toISOString()}:${toDate?.toISOString()}`;
        const cached = await this.cacheManager.get(cacheKey);
        if (cached) {
            return {
                success: true,
                data: cached,
                provider: 'cache',
                cached: true,
            };
        }
        const suitableProviders = this.providers
            .filter((p) => p.isActive && p.supports.includes(assetType))
            .sort((a, b) => a.priority - b.priority);
        for (const provider of suitableProviders) {
            if (!this.canMakeRequest(provider.name, provider.rateLimit)) {
                continue;
            }
            try {
                const result = await this.fetchHistoricalFromProvider(provider.name, symbol, assetType, interval, fromDate, toDate);
                if (result.success && result.data) {
                    await this.cacheManager.set(cacheKey, result.data, 3600000);
                    this.incrementRequestCount(provider.name);
                    return { ...result, cached: false };
                }
            }
            catch (error) {
                this.logger.error(`Error fetching historical from ${provider.name}: ${error.message}`);
                continue;
            }
        }
        return {
            success: false,
            error: 'No providers available for historical data',
            provider: 'none',
            cached: false,
        };
    }
    async fetchPriceFromProvider(providerName, symbol, assetType) {
        switch (providerName) {
            case 'tradermade':
                return this.fetchFromTraderMade(symbol, assetType);
            case 'alphaVantage':
                return this.fetchFromAlphaVantage(symbol, assetType);
            case 'iexCloud':
                return this.fetchFromIEXCloud(symbol, assetType);
            case 'yahooFinance':
                return this.fetchFromYahooFinance(symbol, assetType);
            case 'coinGecko':
                return this.fetchFromCoinGecko(symbol, assetType);
            default:
                return {
                    success: false,
                    error: `Unknown provider: ${providerName}`,
                    provider: providerName,
                    cached: false,
                };
        }
    }
    async fetchHistoricalFromProvider(providerName, symbol, assetType, interval, fromDate, toDate) {
        switch (providerName) {
            case 'tradermade':
                return this.fetchHistoricalFromTraderMade(symbol, assetType, interval, fromDate, toDate);
            case 'alphaVantage':
                return this.fetchHistoricalFromAlphaVantage(symbol, assetType, interval, fromDate, toDate);
            case 'yahooFinance':
                return this.fetchHistoricalFromYahooFinance(symbol, assetType, interval, fromDate, toDate);
            case 'iexCloud':
                return this.fetchHistoricalFromIEXCloud(symbol, assetType, interval, fromDate, toDate);
            default:
                return {
                    success: false,
                    error: `Historical data not supported by provider: ${providerName}`,
                    provider: providerName,
                    cached: false,
                };
        }
    }
    async fetchFromTraderMade(symbol, assetType) {
        try {
            const apiKey = this.configService.get('TRADERMADE_API_KEY');
            if (!apiKey) {
                throw new Error('TraderMade API key not configured');
            }
            const url = `https://marketdata.tradermade.com/api/v1/live?currency=${symbol}&api_key=${apiKey}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            if (response.data &&
                response.data.quotes &&
                response.data.quotes.length > 0) {
                const quote = response.data.quotes[0];
                return {
                    success: true,
                    data: {
                        symbol: quote.base_currency + quote.quote_currency,
                        bid: parseFloat(quote.bid),
                        ask: parseFloat(quote.ask),
                        last: parseFloat(quote.mid),
                        change: 0,
                        changePercent: 0,
                        volume: 0,
                        timestamp: new Date(),
                        provider: 'tradermade',
                    },
                    provider: 'tradermade',
                    cached: false,
                };
            }
            throw new Error('No data received from TraderMade');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'tradermade',
                cached: false,
            };
        }
    }
    async fetchFromAlphaVantage(symbol, assetType) {
        try {
            const apiKey = this.configService.get('ALPHA_VANTAGE_API_KEY');
            if (!apiKey) {
                throw new Error('Alpha Vantage API key not configured');
            }
            let url;
            if (assetType === 'forex') {
                url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol.substring(0, 3)}&to_currency=${symbol.substring(3, 6)}&apikey=${apiKey}`;
            }
            else if (assetType === 'stocks') {
                url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
            }
            else if (assetType === 'crypto') {
                url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${symbol}&to_currency=USD&apikey=${apiKey}`;
            }
            else {
                throw new Error(`Asset type ${assetType} not supported by Alpha Vantage`);
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            if (assetType === 'forex' || assetType === 'crypto') {
                const exchangeRate = response.data['Realtime Currency Exchange Rate'];
                if (exchangeRate) {
                    const rate = parseFloat(exchangeRate['5. Exchange Rate']);
                    return {
                        success: true,
                        data: {
                            symbol,
                            bid: rate * 0.9995,
                            ask: rate * 1.0005,
                            last: rate,
                            change: 0,
                            changePercent: 0,
                            volume: 0,
                            timestamp: new Date(exchangeRate['6. Last Refreshed']),
                            provider: 'alphaVantage',
                        },
                        provider: 'alphaVantage',
                        cached: false,
                    };
                }
            }
            else if (assetType === 'stocks') {
                const quote = response.data['Global Quote'];
                if (quote) {
                    return {
                        success: true,
                        data: {
                            symbol,
                            bid: parseFloat(quote['05. price']) * 0.999,
                            ask: parseFloat(quote['05. price']) * 1.001,
                            last: parseFloat(quote['05. price']),
                            change: parseFloat(quote['09. change']),
                            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                            volume: parseInt(quote['06. volume']),
                            timestamp: new Date(quote['07. latest trading day']),
                            provider: 'alphaVantage',
                        },
                        provider: 'alphaVantage',
                        cached: false,
                    };
                }
            }
            throw new Error('No data received from Alpha Vantage');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'alphaVantage',
                cached: false,
            };
        }
    }
    async fetchFromIEXCloud(symbol, assetType) {
        try {
            const apiKey = this.configService.get('IEX_CLOUD_API_KEY');
            if (!apiKey) {
                throw new Error('IEX Cloud API key not configured');
            }
            if (assetType !== 'stocks') {
                throw new Error(`Asset type ${assetType} not supported by IEX Cloud`);
            }
            const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${apiKey}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            if (response.data) {
                const data = response.data;
                return {
                    success: true,
                    data: {
                        symbol,
                        bid: data.iexBidPrice || data.latestPrice * 0.999,
                        ask: data.iexAskPrice || data.latestPrice * 1.001,
                        last: data.latestPrice,
                        change: data.change,
                        changePercent: data.changePercent * 100,
                        volume: data.latestVolume,
                        timestamp: new Date(data.latestUpdate),
                        provider: 'iexCloud',
                    },
                    provider: 'iexCloud',
                    cached: false,
                };
            }
            throw new Error('No data received from IEX Cloud');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'iexCloud',
                cached: false,
            };
        }
    }
    async fetchFromYahooFinance(symbol, assetType) {
        try {
            let yahooSymbol = symbol;
            if (assetType === 'forex') {
                yahooSymbol = `${symbol}=X`;
            }
            else if (assetType === 'crypto') {
                yahooSymbol = `${symbol}-USD`;
            }
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            if (response.data &&
                response.data.chart &&
                response.data.chart.result.length > 0) {
                const result = response.data.chart.result[0];
                const meta = result.meta;
                return {
                    success: true,
                    data: {
                        symbol,
                        bid: meta.bid || meta.regularMarketPrice * 0.999,
                        ask: meta.ask || meta.regularMarketPrice * 1.001,
                        last: meta.regularMarketPrice,
                        change: meta.regularMarketPrice - meta.previousClose,
                        changePercent: ((meta.regularMarketPrice - meta.previousClose) /
                            meta.previousClose) *
                            100,
                        volume: meta.regularMarketVolume || 0,
                        timestamp: new Date(meta.regularMarketTime * 1000),
                        provider: 'yahooFinance',
                    },
                    provider: 'yahooFinance',
                    cached: false,
                };
            }
            throw new Error('No data received from Yahoo Finance');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'yahooFinance',
                cached: false,
            };
        }
    }
    async fetchFromCoinGecko(symbol, assetType) {
        try {
            if (assetType !== 'crypto') {
                throw new Error(`Asset type ${assetType} not supported by CoinGecko`);
            }
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            const coinId = symbol.toLowerCase();
            if (response.data && response.data[coinId]) {
                const data = response.data[coinId];
                const price = data.usd;
                return {
                    success: true,
                    data: {
                        symbol,
                        bid: price * 0.999,
                        ask: price * 1.001,
                        last: price,
                        change: 0,
                        changePercent: data.usd_24h_change || 0,
                        volume: 0,
                        timestamp: new Date(),
                        provider: 'coinGecko',
                    },
                    provider: 'coinGecko',
                    cached: false,
                };
            }
            throw new Error('No data received from CoinGecko');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'coinGecko',
                cached: false,
            };
        }
    }
    async fetchHistoricalFromAlphaVantage(symbol, assetType, interval, fromDate, toDate) {
        try {
            const apiKey = this.configService.get('ALPHA_VANTAGE_API_KEY');
            if (!apiKey) {
                throw new Error('Alpha Vantage API key not configured');
            }
            let url;
            if (assetType === 'stocks') {
                url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;
            }
            else if (assetType === 'forex') {
                url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${symbol.substring(0, 3)}&to_symbol=${symbol.substring(3, 6)}&apikey=${apiKey}`;
            }
            else {
                throw new Error(`Historical data for ${assetType} not supported by Alpha Vantage`);
            }
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            let timeSeries;
            if (assetType === 'stocks') {
                timeSeries = response.data['Time Series (Daily)'];
            }
            else if (assetType === 'forex') {
                timeSeries = response.data['Time Series (Daily)'];
            }
            if (timeSeries) {
                const historicalData = [];
                Object.entries(timeSeries).forEach(([date, data]) => {
                    const timestamp = new Date(date);
                    if (fromDate && timestamp < fromDate)
                        return;
                    if (toDate && timestamp > toDate)
                        return;
                    historicalData.push({
                        timestamp,
                        open: parseFloat(data['1. open'] || data['1. Open']),
                        high: parseFloat(data['2. high'] || data['2. High']),
                        low: parseFloat(data['3. low'] || data['3. Low']),
                        close: parseFloat(data['4. close'] || data['4. Close']),
                        volume: parseInt(data['5. volume'] || data['5. Volume'] || '0'),
                    });
                });
                return {
                    success: true,
                    data: historicalData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
                    provider: 'alphaVantage',
                    cached: false,
                };
            }
            throw new Error('No historical data received from Alpha Vantage');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'alphaVantage',
                cached: false,
            };
        }
    }
    async fetchHistoricalFromYahooFinance(symbol, assetType, interval, fromDate, toDate) {
        try {
            let yahooSymbol = symbol;
            if (assetType === 'forex') {
                yahooSymbol = `${symbol}=X`;
            }
            else if (assetType === 'crypto') {
                yahooSymbol = `${symbol}-USD`;
            }
            const period1 = fromDate
                ? Math.floor(fromDate.getTime() / 1000)
                : Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
            const period2 = toDate
                ? Math.floor(toDate.getTime() / 1000)
                : Math.floor(Date.now() / 1000);
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${period2}&interval=1d`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            if (response.data &&
                response.data.chart &&
                response.data.chart.result.length > 0) {
                const result = response.data.chart.result[0];
                const timestamps = result.timestamp;
                const ohlcv = result.indicators.quote[0];
                const historicalData = timestamps.map((timestamp, index) => ({
                    timestamp: new Date(timestamp * 1000),
                    open: ohlcv.open[index] || 0,
                    high: ohlcv.high[index] || 0,
                    low: ohlcv.low[index] || 0,
                    close: ohlcv.close[index] || 0,
                    volume: ohlcv.volume[index] || 0,
                }));
                return {
                    success: true,
                    data: historicalData,
                    provider: 'yahooFinance',
                    cached: false,
                };
            }
            throw new Error('No historical data received from Yahoo Finance');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'yahooFinance',
                cached: false,
            };
        }
    }
    async fetchHistoricalFromIEXCloud(symbol, assetType, interval, fromDate, toDate) {
        try {
            const apiKey = this.configService.get('IEX_CLOUD_API_KEY');
            if (!apiKey) {
                throw new Error('IEX Cloud API key not configured');
            }
            if (assetType !== 'stocks') {
                throw new Error(`Asset type ${assetType} not supported by IEX Cloud`);
            }
            const url = `https://cloud.iexapis.com/stable/stock/${symbol}/chart/1y?token=${apiKey}`;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(url));
            if (response.data && Array.isArray(response.data)) {
                const historicalData = response.data
                    .filter((item) => {
                    const timestamp = new Date(item.date);
                    if (fromDate && timestamp < fromDate)
                        return false;
                    if (toDate && timestamp > toDate)
                        return false;
                    return true;
                })
                    .map((item) => ({
                    timestamp: new Date(item.date),
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume,
                }));
                return {
                    success: true,
                    data: historicalData,
                    provider: 'iexCloud',
                    cached: false,
                };
            }
            throw new Error('No historical data received from IEX Cloud');
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                provider: 'iexCloud',
                cached: false,
            };
        }
    }
    canMakeRequest(providerName, rateLimit) {
        const now = Date.now();
        const windowMs = 60000;
        const current = this.requestCounts.get(providerName) || {
            count: 0,
            resetTime: now + windowMs,
        };
        if (now > current.resetTime) {
            this.requestCounts.set(providerName, {
                count: 0,
                resetTime: now + windowMs,
            });
            return true;
        }
        return current.count < rateLimit;
    }
    incrementRequestCount(providerName) {
        const current = this.requestCounts.get(providerName) || {
            count: 0,
            resetTime: Date.now() + 60000,
        };
        current.count++;
        this.requestCounts.set(providerName, current);
    }
    getProviderStatus() {
        return this.providers.map((provider) => ({
            ...provider,
            requestsUsed: this.requestCounts.get(provider.name)?.count || 0,
            nextReset: new Date(this.requestCounts.get(provider.name)?.resetTime || Date.now()),
        }));
    }
    async fetchHistoricalFromTraderMade(symbol, assetType, interval, fromDate, toDate) {
        try {
            if (assetType !== 'forex' && assetType !== 'commodities') {
                throw new Error(`Asset type ${assetType} not supported by TraderMade for historical data`);
            }
            const startDate = fromDate
                ? fromDate.toISOString().split('T')[0]
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0];
            const endDate = toDate
                ? toDate.toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];
            const priceDataPoints = await this.marketDataService.getTradermadeHistoricalData(symbol, startDate, endDate, interval);
            const historicalData = priceDataPoints.map((point) => ({
                timestamp: new Date(point.time * 1000),
                open: point.open,
                high: point.high,
                low: point.low,
                close: point.close,
                volume: point.volume || 0,
            }));
            return {
                success: true,
                data: historicalData,
                provider: 'tradermade',
                cached: false,
            };
        }
        catch (error) {
            this.logger.error(`TraderMade historical data error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                provider: 'tradermade',
                cached: false,
            };
        }
    }
    async testAllProviders() {
        const results = [];
        for (const provider of this.providers.filter((p) => p.isActive)) {
            try {
                const testSymbol = provider.supports.includes('forex')
                    ? 'EURUSD'
                    : provider.supports.includes('stocks')
                        ? 'AAPL'
                        : 'bitcoin';
                const assetType = provider.supports.includes('forex')
                    ? 'forex'
                    : provider.supports.includes('stocks')
                        ? 'stocks'
                        : 'crypto';
                const result = await this.fetchPriceFromProvider(provider.name, testSymbol, assetType);
                results.push({
                    provider: provider.name,
                    status: result.success ? 'working' : 'failed',
                    error: result.error,
                    testSymbol,
                    assetType,
                });
            }
            catch (error) {
                results.push({
                    provider: provider.name,
                    status: 'error',
                    error: error.message,
                });
            }
        }
        return results;
    }
};
exports.MultiProviderMarketDataService = MultiProviderMarketDataService;
exports.MultiProviderMarketDataService = MultiProviderMarketDataService = MultiProviderMarketDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService,
        market_data_service_1.MarketDataService, Object])
], MultiProviderMarketDataService);
//# sourceMappingURL=multi-provider.service.js.map