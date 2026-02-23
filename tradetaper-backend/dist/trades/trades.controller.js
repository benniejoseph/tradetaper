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
var TradesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesController = void 0;
const common_1 = require("@nestjs/common");
const trades_service_1 = require("./trades.service");
const performance_service_1 = require("./performance.service");
const create_trade_dto_1 = require("./dto/create-trade.dto");
const update_trade_dto_1 = require("./dto/update-trade.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const usage_limit_guard_1 = require("../subscriptions/guards/usage-limit.guard");
let TradesController = TradesController_1 = class TradesController {
    tradesService;
    performanceService;
    logger = new common_1.Logger(TradesController_1.name);
    constructor(tradesService, performanceService) {
        this.tradesService = tradesService;
        this.performanceService = performanceService;
    }
    create(createTradeDto, req) {
        this.logger.debug(`📥 Received create trade request: ${JSON.stringify(createTradeDto)}`);
        this.logger.debug(`👤 User: ${req.user?.email || req.user?.id}`);
        return this.tradesService.create(createTradeDto, req.user);
    }
    findAll(req, accountId, page = 1, limit = 10) {
        const safeLimit = Math.min(5000, limit);
        return this.tradesService.findAll(req.user, accountId, undefined, page, safeLimit);
    }
    findAllLite(req, accountId, page = 1, limit = 10, includeTags = 'false', status, direction, assetType, symbol, search, dateFrom, dateTo, isStarred, minPnl, maxPnl, minDuration, maxDuration, sortBy, sortDir) {
        const safeLimit = Math.min(1000, Number(limit) || 10);
        return this.tradesService.findAllLite(req.user, accountId, Number(page) || 1, safeLimit, includeTags === 'true', {
            status,
            direction,
            assetType,
            symbol,
            search,
            dateFrom,
            dateTo,
            isStarred: isStarred === 'true',
            minPnl: minPnl ? Number(minPnl) : undefined,
            maxPnl: maxPnl ? Number(maxPnl) : undefined,
            minDuration: minDuration ? Number(minDuration) : undefined,
            maxDuration: maxDuration ? Number(maxDuration) : undefined,
            sortBy,
            sortDir,
        });
    }
    getSummary(req, accountId, dateFrom, dateTo, status, direction, assetType, symbol, search, isStarred, minPnl, maxPnl, minDuration, maxDuration) {
        return this.performanceService.getPerformanceMetrics(req.user, accountId, dateFrom, dateTo, {
            status,
            direction,
            assetType,
            symbol,
            search,
            isStarred: isStarred === 'true',
            minPnl: minPnl ? Number(minPnl) : undefined,
            maxPnl: maxPnl ? Number(maxPnl) : undefined,
            minDuration: minDuration ? Number(minDuration) : undefined,
            maxDuration: maxDuration ? Number(maxDuration) : undefined,
        });
    }
    findOne(id, req) {
        return this.tradesService.findOne(id, req.user);
    }
    getCandles(id, timeframe, req) {
        return this.tradesService.getTradeCandles(id, timeframe || '1h', req.user);
    }
    update(id, updateTradeDto, req) {
        this.logger.debug(`📥 Received update trade ${id} payload: ${JSON.stringify(updateTradeDto)}`);
        return this.tradesService.update(id, updateTradeDto, req.user);
    }
    remove(id, req) {
        return this.tradesService.remove(id, req.user);
    }
    bulkDelete(body, req) {
        return this.tradesService.bulkDelete(body.tradeIds, req.user);
    }
    bulkUpdate(body, req) {
        return this.tradesService.bulkUpdate(body.updates, req.user);
    }
    bulkImport(body, req) {
        return this.tradesService.bulkImport(body.trades, req.user);
    }
    mergeDuplicates(req, accountId) {
        return this.tradesService.mergeDuplicateExternalTradesForUser(req.user.id, accountId);
    }
};
exports.TradesController = TradesController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(usage_limit_guard_1.UsageLimitGuard),
    (0, usage_limit_guard_1.UsageFeature)('trades'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_trade_dto_1.CreateTradeDto, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('includeTags')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('direction')),
    __param(7, (0, common_1.Query)('assetType')),
    __param(8, (0, common_1.Query)('symbol')),
    __param(9, (0, common_1.Query)('search')),
    __param(10, (0, common_1.Query)('from')),
    __param(11, (0, common_1.Query)('to')),
    __param(12, (0, common_1.Query)('isStarred')),
    __param(13, (0, common_1.Query)('minPnl')),
    __param(14, (0, common_1.Query)('maxPnl')),
    __param(15, (0, common_1.Query)('minDuration')),
    __param(16, (0, common_1.Query)('maxDuration')),
    __param(17, (0, common_1.Query)('sortBy')),
    __param(18, (0, common_1.Query)('sortDir')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object, Object, String, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "findAllLite", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('direction')),
    __param(6, (0, common_1.Query)('assetType')),
    __param(7, (0, common_1.Query)('symbol')),
    __param(8, (0, common_1.Query)('search')),
    __param(9, (0, common_1.Query)('isStarred')),
    __param(10, (0, common_1.Query)('minPnl')),
    __param(11, (0, common_1.Query)('maxPnl')),
    __param(12, (0, common_1.Query)('minDuration')),
    __param(13, (0, common_1.Query)('maxDuration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/candles'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('timeframe')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TradesController.prototype, "getCandles", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_trade_dto_1.UpdateTradeDto, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('bulk/delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "bulkDelete", null);
__decorate([
    (0, common_1.Post)('bulk/update'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "bulkUpdate", null);
__decorate([
    (0, common_1.Post)('bulk/import'),
    (0, common_1.UseGuards)(usage_limit_guard_1.UsageLimitGuard),
    (0, usage_limit_guard_1.UsageFeature)('trades'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Post)('maintenance/merge-duplicates'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "mergeDuplicates", null);
exports.TradesController = TradesController = TradesController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('trades'),
    __metadata("design:paramtypes", [trades_service_1.TradesService,
        performance_service_1.PerformanceService])
], TradesController);
//# sourceMappingURL=trades.controller.js.map