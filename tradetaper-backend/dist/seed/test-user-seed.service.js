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
var TestUserSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUserSeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/entities/user.entity");
const trade_entity_1 = require("../trades/entities/trade.entity");
const tag_entity_1 = require("../tags/entities/tag.entity");
const mt5_account_entity_1 = require("../users/entities/mt5-account.entity");
const strategy_entity_1 = require("../strategies/entities/strategy.entity");
const enums_1 = require("../types/enums");
let TestUserSeedService = TestUserSeedService_1 = class TestUserSeedService {
    userRepository;
    tradeRepository;
    tagRepository;
    mt5AccountRepository;
    strategyRepository;
    logger = new common_1.Logger(TestUserSeedService_1.name);
    constructor(userRepository, tradeRepository, tagRepository, mt5AccountRepository, strategyRepository) {
        this.userRepository = userRepository;
        this.tradeRepository = tradeRepository;
        this.tagRepository = tagRepository;
        this.mt5AccountRepository = mt5AccountRepository;
        this.strategyRepository = strategyRepository;
    }
    async createTestUser() {
        this.logger.log('Creating comprehensive test user with trading data...');
        const testUser = this.userRepository.create({
            email: 'trader@tradetaper.com',
            password: 'TradeTest123!',
            firstName: 'Alex',
            lastName: 'Trader',
        });
        const savedUser = await this.userRepository.save(testUser);
        this.logger.log(`Created test user: ${savedUser.email} (${savedUser.id})`);
        const accounts = await this.createMT5Accounts(savedUser.id);
        const strategies = await this.createStrategies(savedUser.id);
        const tags = await this.createTags(savedUser.id);
        const trades = await this.createTrades(savedUser.id, accounts, strategies, tags);
        const stats = {
            trades: trades.length,
            accounts: accounts.length,
            strategies: strategies.length,
            tags: tags.length,
        };
        this.logger.log(`Test user created successfully with ${JSON.stringify(stats)}`);
        return { user: savedUser, stats };
    }
    async createMT5Accounts(userId) {
        const accountsData = [
            {
                userId,
                accountName: 'FTMO Challenge - 100K',
                server: 'FTMO-Server',
                login: '5012345',
                password: 'demo-password',
                isActive: true,
                balance: 100000,
                accountType: 'demo',
                currency: 'USD',
            },
            {
                userId,
                accountName: 'Live Account - ICMarkets',
                server: 'ICMarkets-Live',
                login: '8012345',
                password: 'live-password',
                isActive: true,
                balance: 15000,
                accountType: 'live',
                currency: 'USD',
            },
        ];
        const accounts = [];
        for (const accountData of accountsData) {
            const account = this.mt5AccountRepository.create(accountData);
            accounts.push(await this.mt5AccountRepository.save(account));
        }
        this.logger.log(`Created ${accounts.length} MT5 accounts`);
        return accounts;
    }
    async createStrategies(userId) {
        const strategiesData = [
            {
                name: 'ICT London Open',
                description: 'Trade London session using ICT concepts.',
                tradingSession: enums_1.TradingSession.LONDON,
                color: '#3B82F6',
                tags: 'ICT, London, MSS, OTE',
                checklist: [
                    { id: '1', text: 'Check DXY bias', completed: false, order: 1 },
                    { id: '2', text: 'Identify previous day high/low', completed: false, order: 2 },
                ],
            },
        ];
        const strategies = [];
        for (const strategyData of strategiesData) {
            const strategy = this.strategyRepository.create({
                ...strategyData,
                userId,
            });
            strategies.push(await this.strategyRepository.save(strategy));
        }
        this.logger.log(`Created ${strategies.length} trading strategies`);
        return strategies;
    }
    async createTags(userId) {
        const tagsData = [
            { name: 'High Probability', color: '#10B981' },
            { name: 'London Open', color: '#3B82F6' },
            { name: 'ICT Setup', color: '#8B5CF6' },
        ];
        const tags = [];
        for (const tagData of tagsData) {
            const tag = this.tagRepository.create({
                ...tagData,
                userId,
            });
            tags.push(await this.tagRepository.save(tag));
        }
        this.logger.log(`Created ${tags.length} tags`);
        return tags;
    }
    async createTrades(userId, accounts, strategies, tags) {
        const trades = [];
        const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY'];
        for (let i = 0; i < 50; i++) {
            const account = accounts[0];
            const strategy = strategies[0];
            const symbol = forexPairs[i % forexPairs.length];
            const openTime = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
            const direction = Math.random() > 0.5 ? enums_1.TradeDirection.LONG : enums_1.TradeDirection.SHORT;
            const status = enums_1.TradeStatus.CLOSED;
            const basePrice = 1.0850;
            const openPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.01;
            const closePrice = openPrice + (Math.random() - 0.5) * basePrice * 0.005;
            const closeTime = new Date(openTime.getTime() + Math.random() * 24 * 60 * 60 * 1000);
            const quantity = 1.0;
            const commission = 5.0;
            const profitOrLoss = Math.random() > 0.6 ? Math.random() * 100 : -Math.random() * 50;
            const trade = this.tradeRepository.create({
                userId,
                accountId: account.id,
                strategyId: strategy.id,
                assetType: enums_1.AssetType.FOREX,
                symbol,
                side: direction,
                status,
                openTime,
                openPrice: parseFloat(openPrice.toFixed(5)),
                closeTime,
                closePrice: parseFloat(closePrice.toFixed(5)),
                quantity,
                commission,
                profitOrLoss: parseFloat(profitOrLoss.toFixed(2)),
                ictConcept: enums_1.ICTConcept.FVG,
                session: enums_1.TradingSession.LONDON,
                setupDetails: 'Good setup with confirmation',
                notes: 'Trade executed well',
                tags: [tags[0]],
            });
            trades.push(trade);
        }
        const savedTrades = await this.tradeRepository.save(trades);
        this.logger.log(`Created ${savedTrades.length} trades`);
        return savedTrades;
    }
    async deleteTestUser() {
        const testUser = await this.userRepository.findOne({
            where: { email: 'trader@tradetaper.com' }
        });
        if (testUser) {
            await this.userRepository.remove(testUser);
            this.logger.log('Test user and all related data deleted');
        }
    }
};
exports.TestUserSeedService = TestUserSeedService;
exports.TestUserSeedService = TestUserSeedService = TestUserSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __param(2, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __param(3, (0, typeorm_1.InjectRepository)(mt5_account_entity_1.MT5Account)),
    __param(4, (0, typeorm_1.InjectRepository)(strategy_entity_1.Strategy)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TestUserSeedService);
//# sourceMappingURL=test-user-seed.service.js.map