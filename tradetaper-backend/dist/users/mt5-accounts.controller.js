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
let MT5AccountsController = class MT5AccountsController {
    mt5AccountsService;
    tradeHistoryParserService;
    tradesService;
    constructor(mt5AccountsService, tradeHistoryParserService, tradesService) {
        this.mt5AccountsService = mt5AccountsService;
        this.tradeHistoryParserService = tradeHistoryParserService;
        this.tradesService = tradesService;
    }
    async create(req, createMT5AccountDto) {
        return this.mt5AccountsService.create(createMT5AccountDto, req.user.id);
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
    async findOne(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        return account;
    }
    getLiveTrades() {
        return [];
    }
    async getCandles(req, id, symbol, timeframe, startTimeStr, endTimeStr) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        if (!symbol || !timeframe || !startTimeStr) {
            throw new common_1.BadRequestException('Missing parameters: symbol, timeframe, startTime');
        }
        const startTime = new Date(startTimeStr);
        const endTime = endTimeStr ? new Date(endTimeStr) : new Date();
        return this.mt5AccountsService.getCandles(id, symbol, timeframe, startTime, endTime);
    }
    async syncAccount(id) {
        await this.mt5AccountsService.syncAccount(id);
    }
    async remove(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        await this.mt5AccountsService.remove(id);
    }
    async linkAccount(req, id, body) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        if (!body.password) {
            throw new common_1.BadRequestException('MT5 password is required to link account');
        }
        const result = await this.mt5AccountsService.linkAccount(id, { password: body.password });
        return {
            success: true,
            message: 'MT5 account linked successfully',
            metaApiAccountId: result.accountId,
            state: result.state,
        };
    }
    async unlinkAccount(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        await this.mt5AccountsService.unlinkAccount(id);
        return {
            success: true,
            message: 'MT5 account unlinked from MetaApi',
        };
    }
    async getConnectionStatus(req, id) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        return this.mt5AccountsService.getConnectionStatus(id);
    }
    async importTrades(req, id, body) {
        const account = await this.mt5AccountsService.findOne(id);
        if (!account || account.userId !== req.user.id) {
            throw new common_1.BadRequestException('MT5 account not found');
        }
        const fromDate = body.fromDate ? new Date(body.fromDate) : new Date(0);
        const toDate = body.toDate ? new Date(body.toDate) : new Date();
        return this.mt5AccountsService.importTradesFromMT5(id, fromDate.toISOString(), toDate.toISOString());
    }
    healthCheck() {
        return {
            status: 'ok',
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
    (0, common_1.Post)('create'),
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
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/trades/live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MT5AccountsController.prototype, "getLiveTrades", null);
__decorate([
    (0, common_1.Get)(':id/candles'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('symbol')),
    __param(3, (0, common_1.Query)('timeframe')),
    __param(4, (0, common_1.Query)('startTime')),
    __param(5, (0, common_1.Query)('endTime')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "getCandles", null);
__decorate([
    (0, common_1.Post)(':id/sync'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
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
    (0, common_1.Post)(':id/link'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "linkAccount", null);
__decorate([
    (0, common_1.Post)(':id/unlink'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "unlinkAccount", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "getConnectionStatus", null);
__decorate([
    (0, common_1.Post)(':id/import-trades'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MT5AccountsController.prototype, "importTrades", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
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
        trades_service_1.TradesService])
], MT5AccountsController);
//# sourceMappingURL=mt5-accounts.controller.js.map