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
const gemini_vision_service_1 = require("../notes/gemini-vision.service");
const accounts_service_1 = require("../users/accounts.service");
const mt5_accounts_service_1 = require("../users/mt5-accounts.service");
const trade_candle_entity_1 = require("./entities/trade-candle.entity");
const yahoo_finance_service_1 = require("../integrations/yahoo-finance/yahoo-finance.service");
const massive_service_1 = require("../integrations/massive/massive.service");
let TradesService = TradesService_1 = class TradesService {
    tradesRepository;
    tradeCandleRepository;
    tagRepository;
    tradesGateway;
    geminiVisionService;
    accountsService;
    mt5AccountsService;
    yahooFinanceService;
    massiveService;
    logger = new common_1.Logger(TradesService_1.name);
    constructor(tradesRepository, tradeCandleRepository, tagRepository, tradesGateway, geminiVisionService, accountsService, mt5AccountsService, yahooFinanceService, massiveService) {
        this.tradesRepository = tradesRepository;
        this.tradeCandleRepository = tradeCandleRepository;
        this.tagRepository = tagRepository;
        this.tradesGateway = tradesGateway;
        this.geminiVisionService = geminiVisionService;
        this.accountsService = accountsService;
        this.mt5AccountsService = mt5AccountsService;
        this.yahooFinanceService = yahooFinanceService;
        this.massiveService = massiveService;
    }
    async getTradeCandles(tradeId, timeframe, userContext) {
        this.logger.debug(`Fetching candles for trade ${tradeId}, timeframe ${timeframe}`);
        try {
            const cached = await this.tradeCandleRepository.findOne({ where: { tradeId, timeframe } });
            if (cached) {
                this.logger.debug(`Cache HIT for trade ${tradeId}`);
                return cached.data;
            }
            this.logger.debug(`Cache MISS for trade ${tradeId}`);
            const trade = await this.findOne(tradeId, userContext);
            const exitTime = trade.closeTime ? new Date(trade.closeTime).getTime() : Date.now();
            let bufferMs = 0;
            switch (timeframe) {
                case '1m':
                    bufferMs = 60 * 1000 * 60 * 2;
                    break;
                case '5m':
                    bufferMs = 60 * 1000 * 60 * 5;
                    break;
                case '15m':
                    bufferMs = 60 * 1000 * 60 * 12;
                    break;
                case '1h':
                    bufferMs = 60 * 1000 * 60 * 48;
                    break;
                case '4h':
                    bufferMs = 60 * 1000 * 60 * 24 * 7;
                    break;
                case '1d':
                    bufferMs = 60 * 1000 * 60 * 24 * 30;
                    break;
                default: bufferMs = 60 * 1000 * 60 * 48;
            }
            const entryTime = new Date(trade.openTime).getTime();
            const startTime = new Date(entryTime - bufferMs);
            const endTime = new Date(exitTime + bufferMs);
            let data = [];
            if (trade.accountId) {
                try {
                    this.logger.debug(`Strategy A: Fetching from MetaApi...`);
                    data = await this.mt5AccountsService.getCandles(trade.accountId, trade.symbol, timeframe, startTime, endTime);
                }
                catch (e) {
                    this.logger.warn(`MetaApi Strategy failed: ${e.message}`);
                }
            }
            if (!data || data.length === 0) {
                this.logger.debug(`Strategy B: Fallback to Massive (Polygon) for ${trade.symbol}...`);
                data = await this.massiveService.getCandles(trade.symbol, timeframe, startTime, endTime);
                this.logger.debug(`Massive returned ${data?.length || 0} candles`);
            }
            if (!data || data.length === 0) {
                this.logger.debug(`Strategy C: Fallback to Yahoo Finance for ${trade.symbol}...`);
                data = await this.yahooFinanceService.getCandles(trade.symbol, timeframe, startTime, endTime);
                this.logger.debug(`Yahoo Finance returned ${data?.length || 0} candles`);
            }
            if (trade.status === enums_1.TradeStatus.CLOSED && data && data.length > 0) {
                this.logger.debug(`Caching result for trade ${tradeId}`);
                try {
                    await this.tradeCandleRepository.save({
                        tradeId: trade.id,
                        symbol: trade.symbol,
                        timeframe,
                        data
                    });
                }
                catch (cacheError) {
                    this.logger.error(`Failed to cache candles: ${cacheError.message}`);
                }
            }
            return data || [];
        }
        catch (error) {
            this.logger.error(`Error in getTradeCandles: ${error.message}`, error.stack);
            throw error;
        }
    }
    async _populateAccountDetails(trades, userId) {
        if (!trades.length)
            return trades;
        const accountIds = [...new Set(trades.map(t => t.accountId).filter(id => id))];
        if (accountIds.length === 0)
            return trades;
        const [manualAccounts, mt5Accounts] = await Promise.all([
            this.accountsService.findAllByUser(userId),
            this.mt5AccountsService.findAllByUser(userId),
        ]);
        const accountMap = new Map();
        manualAccounts.forEach(a => accountMap.set(a.id, { id: a.id, name: a.name, type: 'manual' }));
        mt5Accounts.forEach(a => accountMap.set(a.id, { id: a.id, name: a.accountName, type: 'mt5' }));
        return trades.map(trade => {
            if (trade.accountId) {
                const account = accountMap.get(trade.accountId);
                if (account) {
                    trade.account = account;
                }
            }
            return trade;
        });
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
        trade.calculatePnl();
        const savedTrade = await this.tradesRepository.save(trade);
        const completeTradeData = await this.tradesRepository.findOne({
            where: { id: savedTrade.id },
            relations: ['tags'],
        });
        if (!completeTradeData) {
            throw new common_1.NotFoundException(`Trade with id ${savedTrade.id} not found after creation`);
        }
        const [populatedTrade] = await this._populateAccountDetails([completeTradeData], userContext.id);
        this.logger.log(`Trade created successfully: ${savedTrade.id}`);
        return populatedTrade;
    }
    async findAllByUser(userId) {
        this.logger.debug(`Fetching ALL trades for user ${userId} for analytics`);
        const trades = await this.tradesRepository.find({
            where: { userId },
            relations: ['tags'],
            order: { openTime: 'DESC' },
        });
        return this._populateAccountDetails(trades, userId);
    }
    async findAll(userContext, accountId, options, page = 1, limit = 10) {
        this.logger.log(`User ${userContext.id} fetching trades, account: ${accountId || 'all'}, page: ${page}, limit: ${limit}`);
        const whereClause = {
            userId: userContext.id,
        };
        if (accountId) {
            whereClause.accountId = accountId;
        }
        const [trades, total] = await this.tradesRepository.findAndCount({
            where: whereClause,
            relations: ['tags'],
            order: { openTime: 'DESC' },
            take: limit,
            skip: (page - 1) * limit,
            ...options,
        });
        const populatedTrades = await this._populateAccountDetails(trades, userContext.id);
        this.logger.log(`Found ${trades.length} of ${total} trades for user ${userContext.id}, account filter: ${accountId || 'all'}`);
        return {
            data: populatedTrades,
            total,
            page,
            limit,
        };
    }
    async findDuplicate(userId, symbol, entryDate, externalId) {
        const queryBuilder = this.tradesRepository.createQueryBuilder('trade')
            .where('trade.userId = :userId', { userId })
            .andWhere('trade.accountId IS NOT NULL');
        if (externalId) {
            queryBuilder.andWhere('trade.externalId = :externalId', { externalId });
        }
        else {
            queryBuilder
                .andWhere('trade.symbol = :symbol', { symbol })
                .andWhere('trade.openTime BETWEEN :start AND :end', {
                start: new Date(entryDate.getTime() - 60000),
                end: new Date(entryDate.getTime() + 60000)
            });
        }
        return await queryBuilder.getOne();
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
            const [populatedTrade] = await this._populateAccountDetails([trade], userContext.id);
            return populatedTrade;
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
        trade.calculatePnl();
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
                    trade.closeTime =
                        closeTime === null ? undefined : new Date(closeTime);
                }
                if (tagNames !== undefined) {
                    trade.tags = await this.findOrCreateTags(tagNames, userContext.id);
                }
                trade.calculatePnl();
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
                closeTime: tradeDto.closeTime
                    ? new Date(tradeDto.closeTime)
                    : undefined,
                userId: userContext.id,
                tags: resolvedTags,
            });
            trade.calculatePnl();
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
    __param(1, (0, typeorm_1.InjectRepository)(trade_candle_entity_1.TradeCandle)),
    __param(2, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __param(3, (0, common_1.Inject)(simple_trades_gateway_1.SimpleTradesGateway)),
    __param(4, (0, common_1.Inject)(gemini_vision_service_1.GeminiVisionService)),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => accounts_service_1.AccountsService))),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => mt5_accounts_service_1.MT5AccountsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        simple_trades_gateway_1.SimpleTradesGateway,
        gemini_vision_service_1.GeminiVisionService,
        accounts_service_1.AccountsService,
        mt5_accounts_service_1.MT5AccountsService,
        yahoo_finance_service_1.YahooFinanceService,
        massive_service_1.MassiveService])
], TradesService);
//# sourceMappingURL=trades.service.js.map