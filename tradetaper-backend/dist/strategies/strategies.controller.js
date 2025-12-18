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
exports.StrategiesController = void 0;
const common_1 = require("@nestjs/common");
const strategies_service_1 = require("./strategies.service");
const create_strategy_dto_1 = require("./dto/create-strategy.dto");
const update_strategy_dto_1 = require("./dto/update-strategy.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let StrategiesController = class StrategiesController {
    strategiesService;
    constructor(strategiesService) {
        this.strategiesService = strategiesService;
    }
    async create(createStrategyDto, req) {
        return this.strategiesService.create(createStrategyDto, req.user.id);
    }
    async findAll(req) {
        return this.strategiesService.findAll(req.user.id);
    }
    async getAllWithStats(req) {
        return this.strategiesService.getAllStrategiesWithStats(req.user.id);
    }
    async findOne(id, req) {
        return this.strategiesService.findOne(id, req.user.id);
    }
    getStats() {
        return this.strategiesService.getStrategyStats();
    }
    async update(id, updateStrategyDto, req) {
        return this.strategiesService.update(id, updateStrategyDto, req.user.id);
    }
    async toggleActive(id, req) {
        return this.strategiesService.toggleActive(id, req.user.id);
    }
    async remove(id, req) {
        await this.strategiesService.remove(id, req.user.id);
        return { message: 'Strategy deleted successfully' };
    }
};
exports.StrategiesController = StrategiesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_strategy_dto_1.CreateStrategyDto, Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('with-stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "getAllWithStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StrategiesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_strategy_dto_1.UpdateStrategyDto, Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "toggleActive", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StrategiesController.prototype, "remove", null);
exports.StrategiesController = StrategiesController = __decorate([
    (0, common_1.Controller)('strategies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [strategies_service_1.StrategiesService])
], StrategiesController);
//# sourceMappingURL=strategies.controller.js.map