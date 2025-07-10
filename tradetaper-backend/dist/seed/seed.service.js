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
var SeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const trade_entity_1 = require("../trades/entities/trade.entity");
const enums_1 = require("../types/enums");
const users_service_1 = require("../users/users.service");
const config_1 = require("@nestjs/config");
const date_fns_1 = require("date-fns");
let SeedService = SeedService_1 = class SeedService {
    userRepository;
    tradeRepository;
    usersService;
    configService;
    logger = new common_1.Logger(SeedService_1.name);
    TRADING_ACCOUNTS = [
        'acc_binance_main',
        'acc_kucoin_spot',
        'acc_bybit_futures',
    ];
    constructor(userRepository, tradeRepository, usersService, configService) {
        this.userRepository = userRepository;
        this.tradeRepository = tradeRepository;
        this.usersService = usersService;
        this.configService = configService;
    }
    async onApplicationBootstrap() {
        const nodeEnv = this.configService.get('NODE_ENV');
        const forceSeed = this.configService.get('FORCE_SEED');
        if (nodeEnv === 'production' && forceSeed !== 'true') {
            this.logger.log('Skipping seed data in production environment. Use FORCE_SEED=true to override.');
            return;
        }
        if (nodeEnv !== 'development' && forceSeed !== 'true') {
            this.logger.log('Skipping seed data in non-development environment.');
            return;
        }
        const userCount = await this.userRepository.count();
        const tradeCount = await this.tradeRepository.count();
        if (userCount > 0 &&
            tradeCount > 0 &&
            this.configService.get('FORCE_SEED') !== 'true') {
            this.logger.log('Database likely contains data. Skipping seed. Set FORCE_SEED=true in .env to override.');
            return;
        }
        this.logger.log('Starting database seed process...');
        await this.seedUsersAndTrades();
        this.logger.log('Database seeding completed.');
    }
    async seedUsersAndTrades() {
        try {
            let user1Data;
            let user2Data;
            const existingUser1 = await this.userRepository.findOneBy({
                email: 'user1@example.com',
            });
            if (existingUser1) {
                user1Data = { id: existingUser1.id, email: existingUser1.email };
                this.logger.log(`Found existing user: ${user1Data.email}`);
            }
            else {
                user1Data = await this.usersService.create({
                    email: 'user1@example.com',
                    password: 'password123',
                    firstName: 'Demo',
                    lastName: 'UserOne',
                });
                this.logger.log(`Created user: ${user1Data.email}`);
            }
            const existingUser2 = await this.userRepository.findOneBy({
                email: 'user2@example.com',
            });
            if (existingUser2) {
                user2Data = { id: existingUser2.id, email: existingUser2.email };
                this.logger.log(`Found existing user: ${user2Data.email}`);
            }
            else {
                user2Data = await this.usersService.create({
                    email: 'user2@example.com',
                    password: 'password123',
                    firstName: 'Test',
                    lastName: 'UserTwo',
                });
                this.logger.log(`Created user: ${user2Data.email}`);
            }
            if (user1Data && user1Data.id) {
                const user1TradeCount = await this.tradeRepository.count({
                    where: { userId: user1Data.id },
                });
                if (user1TradeCount === 0) {
                    let totalTrades = 0;
                    for (const accountId of this.TRADING_ACCOUNTS) {
                        const accountTrades = this.generateTradesForAccount(user1Data.id, accountId, 1);
                        for (const tradeData of accountTrades) {
                            const trade = this.tradeRepository.create(tradeData);
                            this.calculateTradeMetrics(trade);
                            await this.tradeRepository.save(trade);
                            totalTrades++;
                        }
                    }
                    this.logger.log(`Seeded ${totalTrades} trades for ${user1Data.email} across ${this.TRADING_ACCOUNTS.length} accounts`);
                }
                else {
                    this.logger.log(`Trades for ${user1Data.email} already exist. Skipping trade seed for user1.`);
                }
            }
            if (user2Data && user2Data.id) {
                const user2TradeCount = await this.tradeRepository.count({
                    where: { userId: user2Data.id },
                });
                if (user2TradeCount === 0) {
                    let totalTrades = 0;
                    for (const accountId of this.TRADING_ACCOUNTS) {
                        const accountTrades = this.generateTradesForAccount(user2Data.id, accountId, 2);
                        for (const tradeData of accountTrades) {
                            const trade = this.tradeRepository.create(tradeData);
                            this.calculateTradeMetrics(trade);
                            await this.tradeRepository.save(trade);
                            totalTrades++;
                        }
                    }
                    this.logger.log(`Seeded ${totalTrades} trades for ${user2Data.email} across ${this.TRADING_ACCOUNTS.length} accounts`);
                }
                else {
                    this.logger.log(`Trades for ${user2Data.email} already exist. Skipping trade seed for user2.`);
                }
            }
        }
        catch (error) {
            this.logger.error('Error during seeding process:', error);
            if (error.stack) {
                this.logger.error(error.stack);
            }
        }
    }
    calculateTradeMetrics(trade) {
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
            if (trade.stopLoss != null) {
                const riskAmount = Math.abs(trade.openPrice - trade.stopLoss) * trade.quantity;
                if (riskAmount > 0) {
                    trade.rMultiple = parseFloat((trade.profitOrLoss / riskAmount).toFixed(2));
                }
            }
        }
    }
    generateTradesForAccount(userId, accountId, userNumber) {
        const trades = [];
        const forexPairs = [
            { symbol: 'EURUSD', basePrice: 1.085, pipValue: 0.0001 },
            { symbol: 'GBPUSD', basePrice: 1.265, pipValue: 0.0001 },
            { symbol: 'USDJPY', basePrice: 151.5, pipValue: 0.01 },
            { symbol: 'AUDUSD', basePrice: 0.65, pipValue: 0.0001 },
            { symbol: 'USDCAD', basePrice: 1.36, pipValue: 0.0001 },
            { symbol: 'NZDUSD', basePrice: 0.595, pipValue: 0.0001 },
            { symbol: 'EURJPY', basePrice: 164.0, pipValue: 0.01 },
            { symbol: 'GBPJPY', basePrice: 192.0, pipValue: 0.01 },
            { symbol: 'CHFJPY', basePrice: 169.0, pipValue: 0.01 },
            { symbol: 'EURGBP', basePrice: 0.86, pipValue: 0.0001 },
        ];
        const concepts = Object.values(enums_1.ICTConcept);
        const sessions = Object.values(enums_1.TradingSession);
        const directions = Object.values(enums_1.TradeDirection);
        const statuses = [
            enums_1.TradeStatus.CLOSED,
            enums_1.TradeStatus.CLOSED,
            enums_1.TradeStatus.CLOSED,
            enums_1.TradeStatus.OPEN,
        ];
        let baseQuantity = 100000;
        let baseDaysBack = 1;
        if (accountId === 'acc_binance_main') {
            baseQuantity = 100000;
            baseDaysBack = 1;
        }
        else if (accountId === 'acc_kucoin_spot') {
            baseQuantity = 75000;
            baseDaysBack = 30;
        }
        else if (accountId === 'acc_bybit_futures') {
            baseQuantity = 150000;
            baseDaysBack = 60;
        }
        for (let i = 0; i < 20; i++) {
            const pair = forexPairs[i % forexPairs.length];
            const concept = concepts[i % concepts.length];
            const session = sessions[i % sessions.length];
            const direction = directions[i % directions.length];
            const status = statuses[i % statuses.length];
            const daysBack = baseDaysBack + Math.floor(i * 2.5) + Math.floor(Math.random() * 5);
            const openTime = (0, date_fns_1.subDays)(new Date(), daysBack);
            const priceVariation = (Math.random() - 0.5) * 0.02;
            const openPrice = pair.basePrice * (1 + priceVariation);
            let closePrice;
            let closeTime;
            let profitFactor = 1;
            if (status === enums_1.TradeStatus.CLOSED) {
                closeTime = (0, date_fns_1.addDays)(openTime, Math.floor(Math.random() * 5) + 1);
                const winRate = userNumber === 1 ? 0.65 : 0.58;
                const isWinningTrade = Math.random() < winRate;
                if (isWinningTrade) {
                    const pipMove = (20 + Math.random() * 60) * pair.pipValue;
                    profitFactor = direction === enums_1.TradeDirection.LONG ? 1 : -1;
                    closePrice = openPrice + pipMove * profitFactor;
                }
                else {
                    const pipMove = (10 + Math.random() * 30) * pair.pipValue;
                    profitFactor = direction === enums_1.TradeDirection.LONG ? -1 : 1;
                    closePrice = openPrice + pipMove * profitFactor;
                }
            }
            const stopLossPips = (15 + Math.random() * 25) * pair.pipValue;
            const takeProfitPips = (30 + Math.random() * 50) * pair.pipValue;
            const stopLoss = direction === enums_1.TradeDirection.LONG
                ? openPrice - stopLossPips
                : openPrice + stopLossPips;
            const takeProfit = direction === enums_1.TradeDirection.LONG
                ? openPrice + takeProfitPips
                : openPrice - takeProfitPips;
            const sizeVariation = 0.5 + Math.random();
            const quantity = Math.floor(baseQuantity * sizeVariation);
            const commission = (quantity / 10000) * (0.5 + Math.random());
            const setupDetails = this.generateSetupDetails(concept, session, accountId, direction);
            trades.push({
                userId,
                accountId,
                assetType: enums_1.AssetType.FOREX,
                symbol: pair.symbol,
                side: direction,
                status,
                openTime,
                openPrice: parseFloat(openPrice.toFixed(pair.symbol.includes('JPY') ? 3 : 5)),
                closeTime,
                closePrice: closePrice
                    ? parseFloat(closePrice.toFixed(pair.symbol.includes('JPY') ? 3 : 5))
                    : undefined,
                quantity,
                commission: parseFloat(commission.toFixed(2)),
                stopLoss: parseFloat(stopLoss.toFixed(pair.symbol.includes('JPY') ? 3 : 5)),
                takeProfit: parseFloat(takeProfit.toFixed(pair.symbol.includes('JPY') ? 3 : 5)),
                ictConcept: concept,
                session,
                setupDetails,
                notes: status === enums_1.TradeStatus.OPEN ? 'Active position' : undefined,
                lessonsLearned: status === enums_1.TradeStatus.CLOSED && Math.random() > 0.7
                    ? this.generateLessons()
                    : undefined,
                mistakesMade: status === enums_1.TradeStatus.CLOSED && Math.random() > 0.8
                    ? this.generateMistakes()
                    : undefined,
            });
        }
        return trades;
    }
    generateSetupDetails(concept, session, accountId, direction) {
        const accountName = accountId.split('_')[1];
        const directionText = direction.toLowerCase();
        const details = [
            `${session} session ${concept.toLowerCase()} setup for ${directionText} entry`,
            `${accountName} account: ${concept} identified during ${session} session`,
            `Clean ${concept.toLowerCase()} formation on ${session} timeframe, ${directionText} bias`,
            `${session} market structure showing ${concept.toLowerCase()}, taking ${directionText} position`,
            `Strong ${concept} pattern during ${session} session, executing ${directionText} trade`,
        ];
        return details[Math.floor(Math.random() * details.length)];
    }
    generateLessons() {
        const lessons = [
            'Perfect execution on ICT model trade setup',
            'Market structure reading was accurate, good timing',
            'Patience paid off waiting for optimal entry point',
            'Risk management rules followed correctly',
            'Multi-timeframe analysis confirmed the bias',
            'Session timing was crucial for this setup',
            'Order flow reading skills improving',
            'Confluence factors all aligned perfectly',
        ];
        return lessons[Math.floor(Math.random() * lessons.length)];
    }
    generateMistakes() {
        const mistakes = [
            'Entered too early without proper confirmation',
            'Ignored key resistance/support level above/below entry',
            'Failed to read market sentiment properly during news',
            'Position size was too large for account risk',
            'Exited position too early due to fear',
            'Did not wait for session-specific setup time',
            'Missed higher timeframe confluences',
            'Rushed entry without proper market structure shift',
        ];
        return mistakes[Math.floor(Math.random() * mistakes.length)];
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = SeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_1.UsersService,
        config_1.ConfigService])
], SeedService);
//# sourceMappingURL=seed.service.js.map