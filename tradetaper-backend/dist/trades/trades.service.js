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
var TradesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trade_entity_1 = require("./entities/trade.entity");
const enums_1 = require("../types/enums");
const tag_entity_1 = require("../tags/entities/tag.entity");
const simple_trades_gateway_1 = require("../websocket/simple-trades.gateway");
let TradesService = TradesService_1 = class TradesService {
    tradesRepository;
    tagRepository;
    tradesGateway;
    logger = new common_1.Logger(TradesService_1.name);
    constructor(tradesRepository, tagRepository, tradesGateway) {
        this.tradesRepository = tradesRepository;
        this.tagRepository = tagRepository;
        this.tradesGateway = tradesGateway;
    }
    calculateAndSetPnl(trade) {
        if (trade.status === enums_1.TradeStatus.CLOSED &&
            trade.openPrice != null &&
            trade.closePrice != null &&
            trade.quantity != null) {
            let pnl = 0;
            if (trade.side === enums_1.TradeDirection.LONG) {
                pnl = (trade.closePrice - trade.openPrice) * trade.quantity;
            }
            else if (trade.side === enums_1.TradeDirection.SHORT) {
                pnl = (trade.openPrice - trade.closePrice) * trade.quantity;
            }
            trade.profitOrLoss = parseFloat((pnl - (trade.commission || 0)).toFixed(4));
        }
        else {
            trade.profitOrLoss = undefined;
        }
    }
    async findOrCreateTags(tagNames, userId) {
        if (!tagNames || tagNames.length === 0) {
            return [];
        }
        const lowerCaseTagNames = tagNames
            .map((name) => name.toLowerCase().trim())
            .filter((name) => name.length > 0);
        if (lowerCaseTagNames.length === 0)
            return [];
        const foundTags = await this.tagRepository.find({
            where: {
                name: (0, typeorm_2.In)(lowerCaseTagNames),
                userId: userId,
            },
        });
        const foundTagNamesSet = new Set(foundTags.map((t) => t.name.toLowerCase()));
        const newTagObjectsToCreate = [];
        lowerCaseTagNames.forEach((name) => {
            if (!foundTagNamesSet.has(name)) {
                newTagObjectsToCreate.push({ name, userId });
            }
        });
        let createdTags = [];
        if (newTagObjectsToCreate.length > 0) {
            const uniqueNewTagObjects = newTagObjectsToCreate.filter((tagObj, index, self) => index === self.findIndex((t) => t.name === tagObj.name));
            const newTagEntities = this.tagRepository.create(uniqueNewTagObjects);
            createdTags = await this.tagRepository.save(newTagEntities);
            createdTags.forEach((tag) => this.logger.log(`Created new tag: "${tag.name}" for user ${userId}`));
        }
        return [...foundTags, ...createdTags];
    }
    async create(createTradeDto, userContext) {
        this.logger.log(`User ${userContext.id} creating trade for symbol ${createTradeDto.symbol}, account ${createTradeDto.accountId || 'default'}`);
        const { tagNames, ...tradeDetails } = createTradeDto;
        const resolvedTags = await this.findOrCreateTags(tagNames || [], userContext.id);
        const trade = this.tradesRepository.create({
            ...tradeDetails,
            openTime: new Date(createTradeDto.openTime),
            closeTime: createTradeDto.closeTime
                ? new Date(createTradeDto.closeTime)
                : undefined,
            userId: userContext.id,
            tags: resolvedTags,
        });
        this.calculateAndSetPnl(trade);
        const savedTrade = await this.tradesRepository.save(trade);
        const completeTradeData = await this.tradesRepository.findOne({
            where: { id: savedTrade.id },
            relations: ['tags'],
        });
        if (!completeTradeData) {
            throw new common_1.NotFoundException(`Trade with id ${savedTrade.id} not found after creation`);
        }
        this.logger.log(`Trade created successfully: ${savedTrade.id}`);
        return completeTradeData;
    }
    async findAll(userContext, accountId, options) {
        this.logger.log(`User ${userContext.id} fetching all their trades, account: ${accountId || 'all'}`);
        const whereClause = {
            userId: userContext.id,
        };
        if (accountId) {
            whereClause.accountId = accountId;
        }
        const trades = await this.tradesRepository.find({
            where: whereClause,
            relations: ['tags'],
            order: { openTime: 'DESC' },
            ...options,
        });
        this.logger.log(`Found ${trades.length} trades for user ${userContext.id}, account filter: ${accountId || 'all'}`);
        return trades;
    }
    async findOne(id, userContext) {
        this.logger.log(`User ${userContext.id} fetching trade with ID ${id}`);
        try {
            const trade = await this.tradesRepository
                .createQueryBuilder('trade')
                .leftJoinAndSelect('trade.tags', 'tag')
                .where('trade.id = :id', { id })
                .andWhere('trade.userId = :userId', { userId: userContext.id })
                .getOneOrFail();
            return trade;
        }
        catch (error) {
            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            this.logger.error(`Error fetching trade with ID ${id} for user ${userContext.id}: ${errorMessage}`);
            throw new common_1.NotFoundException(`Trade with ID "${id}" not found or does not belong to user.`);
        }
    }
    async update(id, updateTradeDto, userContext) {
        this.logger.log(`User ${userContext.id} updating trade with ID ${id}`);
        const trade = await this.tradesRepository.findOne({
            where: { id, userId: userContext.id },
            relations: ['tags'],
        });
        if (!trade) {
            throw new common_1.NotFoundException(`Trade with ID "${id}" not found for update.`);
        }
        const { tagNames, openTime, closeTime, ...otherDetailsToUpdate } = updateTradeDto;
        const partialUpdateData = { ...otherDetailsToUpdate };
        if (openTime !== undefined) {
            partialUpdateData.openTime = new Date(openTime);
        }
        if (closeTime !== undefined) {
            partialUpdateData.closeTime =
                closeTime === null ? undefined : new Date(closeTime);
        }
        else if (Object.prototype.hasOwnProperty.call(updateTradeDto, 'closeTime') &&
            closeTime === null) {
            partialUpdateData.closeTime = undefined;
        }
        this.tradesRepository.merge(trade, partialUpdateData);
        if (tagNames !== undefined) {
            trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
        }
        this.calculateAndSetPnl(trade);
        const updatedTrade = await this.tradesRepository.save(trade);
        return updatedTrade;
    }
    async remove(id, userContext) {
        const trade = await this.findOne(id, userContext);
        const result = await this.tradesRepository.delete(trade.id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Trade with ID "${id}" could not be deleted.`);
        }
        this.logger.log(`User ${userContext.id} removed trade with ID ${id}`);
    }
    async bulkDelete(tradeIds, userContext) {
        this.logger.log(`User ${userContext.id} bulk deleting ${tradeIds.length} trades`);
        const trades = await this.tradesRepository.find({
            where: { id: (0, typeorm_2.In)(tradeIds), userId: userContext.id },
        });
        if (trades.length !== tradeIds.length) {
            throw new common_1.NotFoundException('Some trades not found or do not belong to user');
        }
        const result = await this.tradesRepository.delete({
            id: (0, typeorm_2.In)(tradeIds),
            userId: userContext.id,
        });
        const deletedCount = result.affected || 0;
        this.logger.log(`User ${userContext.id} bulk deleted ${deletedCount} trades`);
        return { deletedCount };
    }
    async bulkUpdate(updates, userContext) {
        this.logger.log(`User ${userContext.id} bulk updating ${updates.length} trades`);
        const tradeIds = updates.map((u) => u.id);
        const trades = await this.tradesRepository.find({
            where: { id: (0, typeorm_2.In)(tradeIds), userId: userContext.id },
            relations: ['tags'],
        });
        if (trades.length !== updates.length) {
            throw new common_1.NotFoundException('Some trades not found or do not belong to user');
        }
        const updatedTrades = [];
        for (const update of updates) {
            const trade = trades.find((t) => t.id === update.id);
            if (trade) {
                const { tagNames, openTime, closeTime, ...otherData } = update.data;
                Object.assign(trade, otherData);
                if (openTime !== undefined) {
                    trade.openTime = new Date(openTime);
                }
                if (closeTime !== undefined) {
                    trade.closeTime = closeTime === null ? undefined : new Date(closeTime);
                }
                if (tagNames !== undefined) {
                    trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
                }
                this.calculateAndSetPnl(trade);
                updatedTrades.push(trade);
            }
        }
        const savedTrades = await this.tradesRepository.save(updatedTrades);
        return { updatedCount: savedTrades.length, trades: savedTrades };
    }
    async bulkImport(trades, userContext) {
        this.logger.log(`User ${userContext.id} bulk importing ${trades.length} trades`);
        const createdTrades = [];
        for (const tradeDto of trades) {
            const { tagNames, ...tradeDetails } = tradeDto;
            const resolvedTags = await this.findOrCreateTags(tagNames || [], userContext.id);
            const trade = this.tradesRepository.create({
                ...tradeDetails,
                openTime: new Date(tradeDto.openTime),
                closeTime: tradeDto.closeTime ? new Date(tradeDto.closeTime) : undefined,
                userId: userContext.id,
                tags: resolvedTags,
            });
            this.calculateAndSetPnl(trade);
            createdTrades.push(trade);
        }
        const savedTrades = await this.tradesRepository.save(createdTrades);
        return { importedCount: savedTrades.length, trades: savedTrades };
    }
};
exports.TradesService = TradesService;
exports.TradesService = TradesService = TradesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __param(1, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __param(2, (0, common_1.Inject)(simple_trades_gateway_1.SimpleTradesGateway)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        simple_trades_gateway_1.SimpleTradesGateway])
], TradesService);
//# sourceMappingURL=trades.service.js.map