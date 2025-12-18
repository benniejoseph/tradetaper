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
const create_trade_dto_1 = require("./dto/create-trade.dto");
const update_trade_dto_1 = require("./dto/update-trade.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let TradesController = TradesController_1 = class TradesController {
    tradesService;
    logger = new common_1.Logger(TradesController_1.name);
    constructor(tradesService) {
        this.tradesService = tradesService;
    }
    create(createTradeDto, req) {
        this.logger.debug(`📥 Received create trade request: ${JSON.stringify(createTradeDto)}`);
        this.logger.debug(`👤 User: ${req.user?.email || req.user?.id}`);
        return this.tradesService.create(createTradeDto, req.user);
    }
    findAll(req, accountId, page = 1, limit = 10) {
        const safeLimit = Math.min(100, limit);
        return this.tradesService.findAll(req.user, accountId, undefined, page, safeLimit);
    }
    findOne(id, req) {
        return this.tradesService.findOne(id, req.user);
    }
    update(id, updateTradeDto, req) {
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
};
exports.TradesController = TradesController;
__decorate([
    (0, common_1.Post)(),
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
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "findOne", null);
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
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "bulkImport", null);
exports.TradesController = TradesController = TradesController_1 = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('trades'),
    __metadata("design:paramtypes", [trades_service_1.TradesService])
], TradesController);
//# sourceMappingURL=trades.controller.js.map