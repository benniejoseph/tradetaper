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
var MarketDataController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataController = void 0;
const common_1 = require("@nestjs/common");
const multi_provider_service_1 = require("./multi-provider.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MarketDataController = MarketDataController_1 = class MarketDataController {
    multiProviderService;
    logger = new common_1.Logger(MarketDataController_1.name);
    constructor(multiProviderService) {
        this.multiProviderService = multiProviderService;
    }
    async getForexHistoricalData(baseCurrency, quoteCurrency, startDate, endDate, interval) {
        const symbol = `${baseCurrency.toUpperCase()}${quoteCurrency.toUpperCase()}`;
        this.logger.log(`[MarketDataController] Forex request: ${symbol}, interval=${interval}`);
        return this.getHistoricalDataForAssetType(symbol, 'forex', startDate, endDate, interval);
    }
    async getCommoditiesHistoricalData(symbol, startDate, endDate, interval) {
        this.logger.log(`[MarketDataController] Commodities request: ${symbol}, interval=${interval}`);
        return this.getHistoricalDataForAssetType(symbol.toUpperCase(), 'commodities', startDate, endDate, interval);
    }
    async getStocksHistoricalData(symbol, startDate, endDate, interval) {
        this.logger.log(`[MarketDataController] Stocks request: ${symbol}, interval=${interval}`);
        return this.getHistoricalDataForAssetType(symbol.toUpperCase(), 'stocks', startDate, endDate, interval);
    }
    async getCryptoHistoricalData(symbol, startDate, endDate, interval) {
        this.logger.log(`[MarketDataController] Crypto request: ${symbol}, interval=${interval}`);
        return this.getHistoricalDataForAssetType(symbol.toUpperCase(), 'crypto', startDate, endDate, interval);
    }
    async getHistoricalDataForAssetType(symbol, assetType, startDate, endDate, interval) {
        if (!symbol || !startDate || !endDate || !interval) {
            this.logger.warn('[MarketDataController] Missing required parameters.');
            throw new common_1.HttpException('Missing required parameters: symbol, startDate, endDate, interval', common_1.HttpStatus.BAD_REQUEST);
        }
        const validIntervals = [
            'daily',
            'hourly',
            '4hourly',
            '15minute',
            '5minute',
            '1minute',
            '1day',
        ];
        if (!validIntervals.includes(interval.toLowerCase())) {
            this.logger.warn(`[MarketDataController] Invalid interval received: ${interval}`);
            throw new common_1.HttpException(`Invalid interval: ${interval}. Valid intervals are: ${validIntervals.join(', ')}`, common_1.HttpStatus.BAD_REQUEST);
        }
        this.logger.log(`[MarketDataController] Calling MultiProviderMarketDataService.getHistoricalPrices with: symbol=${symbol}, assetType=${assetType}, interval=${interval.toLowerCase()}`);
        try {
            const result = await this.multiProviderService.getHistoricalPrices(symbol, assetType, interval.toLowerCase(), new Date(startDate), new Date(endDate));
            if (!result.success) {
                this.logger.error(`[MarketDataController] Failed to get historical data: ${result.error}`);
                throw new common_1.HttpException(result.error || 'Failed to fetch historical data', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const data = result.data;
            const priceDataPoints = data.map((item) => ({
                time: Math.floor(item.timestamp.getTime() / 1000),
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
            }));
            this.logger.log(`[MarketDataController] Successfully fetched ${priceDataPoints.length} data points from provider: ${result.provider}`);
            return priceDataPoints;
        }
        catch (error) {
            this.logger.error(`[MarketDataController] Error fetching historical data: ${error.message}`);
            throw new common_1.HttpException('Failed to fetch historical data', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.MarketDataController = MarketDataController;
__decorate([
    (0, common_1.Get)('historical/forex/:baseCurrency/:quoteCurrency'),
    __param(0, (0, common_1.Param)('baseCurrency')),
    __param(1, (0, common_1.Param)('quoteCurrency')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __param(4, (0, common_1.Query)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketDataController.prototype, "getForexHistoricalData", null);
__decorate([
    (0, common_1.Get)('historical/commodities/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketDataController.prototype, "getCommoditiesHistoricalData", null);
__decorate([
    (0, common_1.Get)('historical/stocks/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketDataController.prototype, "getStocksHistoricalData", null);
__decorate([
    (0, common_1.Get)('historical/crypto/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('interval')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MarketDataController.prototype, "getCryptoHistoricalData", null);
exports.MarketDataController = MarketDataController = MarketDataController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('market-data'),
    __metadata("design:paramtypes", [multi_provider_service_1.MultiProviderMarketDataService])
], MarketDataController);
//# sourceMappingURL=market-data.controller.js.map