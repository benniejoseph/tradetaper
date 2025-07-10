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
exports.StrategiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const strategy_entity_1 = require("./entities/strategy.entity");
let StrategiesService = class StrategiesService {
    strategiesRepository;
    constructor(strategiesRepository) {
        this.strategiesRepository = strategiesRepository;
    }
    async create(createStrategyDto, userId) {
        const strategy = this.strategiesRepository.create({
            ...createStrategyDto,
            userId,
        });
        return await this.strategiesRepository.save(strategy);
    }
    async findAll(userId) {
        return await this.strategiesRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id, userId) {
        const strategy = await this.strategiesRepository.findOne({
            where: { id, userId },
        });
        if (!strategy) {
            throw new common_1.NotFoundException(`Strategy with ID ${id} not found`);
        }
        return strategy;
    }
    async update(id, updateStrategyDto, userId) {
        const strategy = await this.findOne(id, userId);
        Object.assign(strategy, updateStrategyDto);
        return await this.strategiesRepository.save(strategy);
    }
    async remove(id, userId) {
        const strategy = await this.findOne(id, userId);
        await this.strategiesRepository.remove(strategy);
    }
    async toggleActive(id, userId) {
        const strategy = await this.findOne(id, userId);
        strategy.isActive = !strategy.isActive;
        return await this.strategiesRepository.save(strategy);
    }
    async getStrategyStats(id, userId) {
        const strategy = await this.findOne(id, userId);
        return {
            totalTrades: 0,
            closedTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            totalPnl: 0,
            averagePnl: 0,
            averageWin: 0,
            averageLoss: 0,
            profitFactor: 0,
        };
    }
    async getAllStrategiesWithStats(userId) {
        const strategies = await this.findAll(userId);
        const strategiesWithStats = await Promise.all(strategies.map(async (strategy) => {
            const stats = await this.getStrategyStats(strategy.id, userId);
            return {
                ...strategy,
                stats,
            };
        }));
        return strategiesWithStats;
    }
};
exports.StrategiesService = StrategiesService;
exports.StrategiesService = StrategiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(strategy_entity_1.Strategy)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StrategiesService);
//# sourceMappingURL=strategies.service.js.map