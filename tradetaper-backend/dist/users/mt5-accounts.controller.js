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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MT5AccountsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const mt5_accounts_service_1 = require("./mt5-accounts.service");
const mt5_account_dto_1 = require("./dto/mt5-account.dto");
const trade_history_parser_service_1 = require("./trade-history-parser.service");
const trades_service_1 = require("../trades/trades.service");
const metaapi_service_1 = require("./metaapi.service");
let MT5AccountsController = class MT5AccountsController {
    mt5AccountsService;
    tradeHistoryParserService;
    tradesService;
    metaApiService;
    constructor(mt5AccountsService, tradeHistoryParserService, tradesService, metaApiService) {
        this.mt5AccountsService = mt5AccountsService;
        this.tradeHistoryParserService = tradeHistoryParserService;
        this.tradesService = tradesService;
        this.metaApiService = metaApiService;
    }
    async create(req, createMT5AccountDto) {
        const credentials = {
            accountName: createMT5AccountDto.accountName,
            server: createMT5AccountDto.server,
            login: createMT5AccountDto.login,
            password: createMT5AccountDto.password,
            isRealAccount: createMT5AccountDto.isRealAccount || false,
        };
        return this.metaApiService.addMT5Account(req.user.id, credentials);
    }
    async createManual(req, createMT5AccountDto) {
        const manualAccount = {
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: req.user.id,
            accountName: createMT5AccountDto.accountName,
            server: createMT5AccountDto.server || 'Manual-Upload',
            login: createMT5AccountDto.login,
            isRealAccount: createMT5AccountDto.isRealAccount || false,
            isManual: true,
            connectionStatus: 'manual',
            balance: 0,
            equity: 0,
            margin: 0,
            freeMargin: 0,
            leverage: 1,
            currency: 'USD',
            trades: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return this.mt5AccountsService.createManual(manualAccount);
    }
    async findAll(req) {
        return this.mt5AccountsService.findAllByUser(req.user.id);
    }
    async getAvailableServers() {
        return this.metaApiService.getAvailableServers();
    }
    async findOne(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        return account;
    }
    async getAccountStatus(id) {
        return this.metaApiService.getAccountStatus(id);
    }
    async getHistoricalTrades(id, startDate, endDate, limit) {
        return this.metaApiService.getHistoricalTrades(id, {
            startDate,
            endDate,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async getLiveTrades(id) {
        return [];
    }
    async connectAccount(id) {
        return {
            message: 'MetaApi connection is temporarily disabled',
            status: 'disabled'
        };
    }
    async startStreaming(id) {
        return {
            message: 'MetaApi streaming is temporarily disabled',
            status: 'disabled'
        };
    }
    async stopStreaming(id) {
        return {
            message: 'MetaApi streaming is temporarily disabled',
            status: 'disabled'
        };
    }
    async syncAccount(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        return this.mt5AccountsService.syncAccount(id);
    }
    async remove(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        const isManualAccount = account.metadata?.isManual || account.connectionStatus === 'manual';
        if (!isManualAccount) {
            throw new common_1.BadRequestException('MetaApi account removal is temporarily disabled');
        }
        else {
            await this.mt5AccountsService.remove(id);
        }
    }
    async importTrades(req, id, fromDate, toDate) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        throw new common_1.BadRequestException('Trade import is not available for manual accounts. Please upload trade history file instead.');
    }
    async reconnectAccount(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        return {
            message: 'MetaApi reconnection is temporarily disabled',
            status: 'disabled'
        };
    }
    async healthCheck() {
        return {
            status: 'healthy',
            message: 'MT5 Accounts service is running (MetaApi disabled)',
            timestamp: new Date().toISOString(),
        };
    }
    async update(req, id, updateMT5AccountDto) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        return this.mt5AccountsService.update(id, updateMT5AccountDto);
    }
};
exports.MT5AccountsController = MT5AccountsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mt5_account_dto_1.CreateMT5AccountDto]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('manual'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mt5_account_dto_1.CreateManualMT5AccountDto]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "createManual", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('servers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "getAvailableServers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "getAccountStatus", null);
__decorate([
    (0, common_1.Get)(':id/trades'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "getHistoricalTrades", null);
__decorate([
    (0, common_1.Get)(':id/trades/live'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "getLiveTrades", null);
__decorate([
    (0, common_1.Post)(':id/connect'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "connectAccount", null);
__decorate([
    (0, common_1.Post)(':id/stream/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "startStreaming", null);
__decorate([
    (0, common_1.Post)(':id/stream/stop'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "stopStreaming", null);
__decorate([
    (0, common_1.Post)(':id/sync'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "syncAccount", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/import-trades'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('fromDate')),
    __param(3, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "importTrades", null);
__decorate([
    (0, common_1.Post)(':id/reconnect'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "reconnectAccount", null);
__decorate([
    (0, common_1.Get)('health/check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, mt5_account_dto_1.UpdateMT5AccountDto]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "update", null);
exports.MT5AccountsController = MT5AccountsController = __decorate([
    (0, common_1.Controller)('mt5-accounts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [mt5_accounts_service_1.MT5AccountsService,
        trade_history_parser_service_1.TradeHistoryParserService,
        trades_service_1.TradesService,
        metaapi_service_1.MetaApiService])
], MT5AccountsController);
//# sourceMappingURL=mt5-accounts.controller.js.map