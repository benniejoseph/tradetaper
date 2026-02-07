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
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const subscription_entity_1 = require("../entities/subscription.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const trade_entity_1 = require("../../trades/entities/trade.entity");
const account_entity_1 = require("../../users/entities/account.entity");
const mt5_account_entity_1 = require("../../users/entities/mt5-account.entity");
const note_entity_1 = require("../../notes/entities/note.entity");
const strategy_entity_1 = require("../../strategies/entities/strategy.entity");
const razorpay_service_1 = require("./razorpay.service");
const typeorm_3 = require("typeorm");
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    subscriptionRepository;
    userRepository;
    tradeRepository;
    accountRepository;
    mt5AccountRepository;
    noteRepository;
    strategyRepository;
    configService;
    razorpayService;
    logger = new common_1.Logger(SubscriptionService_1.name);
    pricingPlans;
    constructor(subscriptionRepository, userRepository, tradeRepository, accountRepository, mt5AccountRepository, noteRepository, strategyRepository, configService, razorpayService) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.tradeRepository = tradeRepository;
        this.accountRepository = accountRepository;
        this.mt5AccountRepository = mt5AccountRepository;
        this.noteRepository = noteRepository;
        this.strategyRepository = strategyRepository;
        this.configService = configService;
        this.razorpayService = razorpayService;
        this.pricingPlans = [
            {
                id: 'free',
                name: 'free',
                displayName: 'Free',
                description: 'Get started with basic journaling.',
                features: [
                    '1 Manual Account',
                    '50 Trade Records',
                    '3 Strategies',
                    'Minimum Storage',
                    'Economic Chart & News Hub',
                    'Restriction on Discipline Page',
                    'Restriction on Notes Page',
                    'Restriction on Backtesting',
                    'Restriction on Psychology',
                    'No MetaTrader Connect',
                    'No Live Chart & AI Analysis',
                    'No Reports'
                ],
                priceMonthly: 0,
                priceYearly: 0,
                razorpayPlanMonthlyId: '',
                razorpayPlanYearlyId: '',
                limits: {
                    manualAccounts: 1,
                    mt5Accounts: 0,
                    trades: 50,
                    strategies: 3,
                    notes: 0,
                    storage: 'Minimum',
                    marketIntelligence: 'basic',
                    discipline: false,
                    backtesting: 'restricted',
                    psychology: false,
                    reports: false,
                    aiAnalysis: false
                },
            },
            {
                id: 'essential',
                name: 'essential',
                displayName: 'Essential',
                description: 'Perfect for growing traders.',
                features: [
                    '3 Manual Accounts',
                    'Connect 2 MetaTrader Accounts',
                    '500 Trade Records',
                    '7 Strategies',
                    '1GB Storage',
                    'Economic Chart & News Hub',
                    'Access to Discipline Page',
                    '50 Notes',
                    'Restriction on Pattern Discovery',
                    'Restriction on Psychology',
                    'No Live Chart & AI Analysis',
                    'No Reports'
                ],
                priceMonthly: 1999,
                priceYearly: 19999,
                razorpayPlanMonthlyId: this.configService.get('RAZORPAY_PLAN_ESSENTIAL_MONTHLY') || '',
                razorpayPlanYearlyId: this.configService.get('RAZORPAY_PLAN_ESSENTIAL_YEARLY') || '',
                limits: {
                    manualAccounts: 3,
                    mt5Accounts: 2,
                    trades: 500,
                    strategies: 7,
                    notes: 50,
                    storage: '1GB',
                    marketIntelligence: 'basic',
                    discipline: true,
                    backtesting: 'restricted',
                    psychology: false,
                    reports: false,
                    aiAnalysis: false
                },
            },
            {
                id: 'premium',
                name: 'premium',
                displayName: 'Premium',
                description: 'Unlimited access for pros.',
                features: [
                    'Unlimited Manual Accounts',
                    'Unlimited MetaTrader Accounts',
                    'Unlimited Trade Records',
                    'Unlimited Strategies',
                    'Unlimited Notes',
                    '5GB Storage',
                    'Full Market Intelligence',
                    'Full Discipline Access',
                    'Full Backtesting Access',
                    'AI Psychology Insights',
                    'Weekly & Monthly Reports'
                ],
                priceMonthly: 4999,
                priceYearly: 49999,
                razorpayPlanMonthlyId: this.configService.get('RAZORPAY_PLAN_PREMIUM_MONTHLY') || '',
                razorpayPlanYearlyId: this.configService.get('RAZORPAY_PLAN_PREMIUM_YEARLY') || '',
                limits: {
                    manualAccounts: 'unlimited',
                    mt5Accounts: 'unlimited',
                    trades: 'unlimited',
                    strategies: 'unlimited',
                    notes: 'unlimited',
                    storage: '5GB',
                    marketIntelligence: 'full',
                    discipline: true,
                    backtesting: 'full',
                    psychology: true,
                    reports: true,
                    aiAnalysis: true
                },
            },
        ];
    }
    getPricingPlans() {
        return this.pricingPlans;
    }
    getPricingPlan(planId) {
        return (this.pricingPlans.find((plan) => plan.id === planId || plan.name === planId) || null);
    }
    async getOrCreateSubscription(userId) {
        let subscription = await this.subscriptionRepository.findOne({
            where: { userId },
        });
        if (!subscription) {
            subscription = this.subscriptionRepository.create({
                userId,
                plan: 'free',
                status: subscription_entity_1.SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            });
            subscription = await this.subscriptionRepository.save(subscription);
            this.logger.log(`Created free subscription for user ${userId}`);
        }
        return subscription;
    }
    async forceUpdateSubscriptionPlan(userId, planId) {
        const subscription = await this.getOrCreateSubscription(userId);
        const plan = this.getPricingPlan(planId);
        if (!plan) {
            throw new Error(`Invalid plan ID: ${planId}`);
        }
        if (subscription.plan !== planId) {
            subscription.plan = planId;
            await this.subscriptionRepository.save(subscription);
            this.logger.log(`Forced subscription update for user ${userId} to ${planId}`);
        }
        return subscription;
    }
    async upgradeUserByEmail(email, planId) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new common_1.NotFoundException(`User with email ${email} not found`);
        }
        return this.forceUpdateSubscriptionPlan(user.id, planId);
    }
    async getCurrentSubscription(userId) {
        const subscription = await this.getOrCreateSubscription(userId);
        const usage = await this.getCurrentUsage(userId);
        return {
            currentPlan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
            usage,
        };
    }
    async getCurrentUsage(userId) {
        if (!userId) {
            throw new Error('User ID is required to get usage');
        }
        const subscription = await this.getOrCreateSubscription(userId);
        const now = new Date();
        const periodStart = subscription.currentPeriodStart || new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = subscription.currentPeriodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const tradesCount = await this.tradeRepository.count({
            where: {
                userId,
                openTime: (0, typeorm_3.Between)(periodStart, periodEnd),
            },
        });
        const manualAccountsCount = await this.accountRepository.count({
            where: {
                userId,
                isActive: true,
            },
        });
        const mt5AccountsCount = await this.mt5AccountRepository.count({
            where: {
                userId,
                isActive: true,
            },
        });
        const notesCount = await this.noteRepository.count({
            where: {
                userId,
            },
        });
        return {
            trades: tradesCount,
            manualAccounts: manualAccountsCount,
            mt5Accounts: mt5AccountsCount,
            notes: notesCount,
            periodStart,
            periodEnd,
        };
    }
    async hasFeatureAccess(userId, feature) {
        const subscription = await this.getOrCreateSubscription(userId);
        const plan = this.getPricingPlan(subscription.plan);
        if (!plan)
            return false;
        switch (feature) {
            case 'discipline':
                return plan.limits.discipline;
            case 'market_data':
                return true;
            case 'unlimited_trades':
                return plan.limits.trades === 'unlimited';
            case 'advanced_analytics':
                return plan.limits.aiAnalysis;
            case 'psychology':
                return plan.limits.psychology;
            case 'reports':
                return plan.limits.reports;
            default:
                return false;
        }
    }
    async checkUsageLimit(userId, feature) {
        const subscription = await this.getCurrentSubscription(userId);
        const plan = this.getPricingPlan(subscription.currentPlan);
        if (!plan) {
            return false;
        }
        const limitKey = feature === 'accounts' ? 'manualAccounts' : feature;
        const limit = plan.limits[limitKey];
        if (limit === 'unlimited') {
            return true;
        }
        const usageKey = feature === 'accounts' ? 'manualAccounts' : feature;
        const usage = subscription.usage[usageKey];
        if (typeof usage === 'undefined')
            return true;
        return usage < limit;
    }
    async incrementUsage(userId, feature) {
        if (!userId || !feature) {
            return;
        }
        const user = await this.subscriptionRepository.findOne({
            where: {
                userId: userId,
            },
        });
        if (!user) {
            throw new Error('User not found');
        }
        const subscription = await this.getCurrentSubscription(userId);
        if (!subscription) {
            return;
        }
        if (subscription.currentPlan === 'free') {
            this.logger.log(`Incrementing usage for user ${userId}, feature: ${feature}`);
        }
    }
    async createRazorpaySubscription(userId, planId, period) {
        this.logger.log(`Creating Razorpay subscription for user ${userId}, plan: ${planId}, period: ${period}`);
        const planConfig = this.getPricingPlan(planId);
        if (!planConfig)
            throw new common_1.BadRequestException('Invalid plan ID');
        const razorpayPlanId = period === 'monthly' ? planConfig.razorpayPlanMonthlyId : planConfig.razorpayPlanYearlyId;
        if (!razorpayPlanId)
            throw new common_1.BadRequestException('Razorpay plan not configured for this tier');
        const subscription = await this.getOrCreateSubscription(userId);
        let customerId = subscription.razorpayCustomerId;
        if (!customerId) {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            try {
                const customer = await this.razorpayService.createCustomer(user.email, user.firstName ? `${user.firstName} ${user.lastName}` : user.email);
                customerId = customer.id;
                subscription.razorpayCustomerId = customerId;
                await this.subscriptionRepository.save(subscription);
            }
            catch (e) {
                this.logger.error('Failed to create Razorpay customer', e);
                throw new common_1.InternalServerErrorException('Payment initialization failed');
            }
        }
        try {
            const sub = await this.razorpayService.createSubscription(razorpayPlanId);
            subscription.razorpaySubscriptionId = sub.id;
            await this.subscriptionRepository.save(subscription);
            return {
                subscriptionId: sub.id,
                key: this.configService.get('RAZORPAY_KEY_ID'),
                currency: 'INR',
                name: 'TradeTaper',
                description: `${planConfig.displayName} (${period})`,
                customer_id: customerId,
            };
        }
        catch (e) {
            this.logger.error('Failed to create Razorpay subscription', e);
            throw new common_1.InternalServerErrorException('Failed to initiate subscription');
        }
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __param(3, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __param(4, (0, typeorm_1.InjectRepository)(mt5_account_entity_1.MT5Account)),
    __param(5, (0, typeorm_1.InjectRepository)(note_entity_1.Note)),
    __param(6, (0, typeorm_1.InjectRepository)(strategy_entity_1.Strategy)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        razorpay_service_1.RazorpayService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map