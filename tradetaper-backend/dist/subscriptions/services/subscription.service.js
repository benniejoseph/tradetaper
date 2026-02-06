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
const stripe_service_1 = require("./stripe.service");
const user_entity_1 = require("../../users/entities/user.entity");
const razorpay_service_1 = require("./razorpay.service");
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    subscriptionRepository;
    userRepository;
    configService;
    stripeService;
    razorpayService;
    logger = new common_1.Logger(SubscriptionService_1.name);
    pricingPlans;
    constructor(subscriptionRepository, userRepository, configService, stripeService, razorpayService) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.stripeService = stripeService;
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
                stripePriceMonthlyId: '',
                stripePriceYearlyId: '',
                stripeProductId: '',
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
                stripePriceMonthlyId: this.configService.get('STRIPE_PRICE_ESSENTIAL_MONTHLY') || '',
                stripePriceYearlyId: this.configService.get('STRIPE_PRICE_ESSENTIAL_YEARLY') || '',
                stripeProductId: this.configService.get('STRIPE_PRODUCT_ESSENTIAL') || '',
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
                stripePriceMonthlyId: this.configService.get('STRIPE_PRICE_PREMIUM_MONTHLY') || '',
                stripePriceYearlyId: this.configService.get('STRIPE_PRICE_PREMIUM_YEARLY') || '',
                stripeProductId: this.configService.get('STRIPE_PRODUCT_PREMIUM') || '',
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
    async getCurrentSubscription(userId) {
        const subscription = await this.getOrCreateSubscription(userId);
        const usage = this.getCurrentUsage(userId);
        return {
            currentPlan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
            usage,
        };
    }
    getCurrentUsage(userId) {
        if (!userId) {
            throw new Error('User ID is required to get usage');
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            trades: 0,
            manualAccounts: 0,
            mt5Accounts: 0,
            notes: 0,
            periodStart: startOfMonth,
            periodEnd: endOfMonth,
        };
    }
    async createCheckoutSession(userId, priceId, successUrl, cancelUrl) {
        try {
            this.logger.log(`🔍 Creating checkout session for user ${userId}, price: ${priceId}`);
            const subscription = await this.getOrCreateSubscription(userId);
            this.logger.log(`✅ Retrieved subscription for user ${userId}`);
            let customerId = subscription.stripeCustomerId;
            if (!customerId) {
                this.logger.log(`🆕 Creating new Stripe customer for user ${userId}`);
                try {
                    const user = await this.userRepository.findOne({
                        where: { id: userId },
                    });
                    if (!user) {
                        throw new Error(`User not found for id ${userId}`);
                    }
                    const name = user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : undefined;
                    const customer = await this.stripeService.createCustomer(user.email, name);
                    customerId = customer.id;
                    this.logger.log(`✅ Created Stripe customer: ${customerId}`);
                    subscription.stripeCustomerId = customerId;
                    await this.subscriptionRepository.save(subscription);
                    this.logger.log(`✅ Updated subscription with customer ID`);
                }
                catch (customerError) {
                    this.logger.error(`❌ Failed to create Stripe customer:`, {
                        error: customerError.message,
                        code: customerError.code,
                        type: customerError.type,
                        userId,
                    });
                    throw customerError;
                }
            }
            else {
                this.logger.log(`✅ Using existing Stripe customer: ${customerId}`);
            }
            this.logger.log(`🛒 Creating Stripe checkout session...`);
            const session = await this.stripeService.createCheckoutSession(priceId, customerId, successUrl, cancelUrl, userId);
            this.logger.log(`✅ Checkout session created: ${session.id}`);
            return {
                sessionId: session.id,
                url: session.url || '',
            };
        }
        catch (error) {
            this.logger.error(`❌ Stripe checkout session creation failed:`, {
                error: error.message,
                code: error.code,
                type: error.type,
                requestId: error.requestId,
                statusCode: error.statusCode,
                userId,
                priceId,
                stack: error.stack,
            });
            throw new common_1.HttpException(`Failed to create checkout session: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createPortalSession(userId, returnUrl) {
        try {
            const subscription = await this.getOrCreateSubscription(userId);
            if (!subscription.stripeCustomerId) {
                throw new common_1.HttpException('No active subscription found', common_1.HttpStatus.NOT_FOUND);
            }
            const session = await this.stripeService.createBillingPortalSession(subscription.stripeCustomerId, returnUrl);
            return { url: session.url };
        }
        catch (error) {
            this.logger.error('Failed to create portal session:', error);
            throw new common_1.HttpException('Failed to create portal session', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async handleWebhookEvent(event) {
        this.logger.log(`Processing webhook event: ${event.type}`);
        try {
            switch (event.type) {
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdate(event.data.object);
                    break;
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCancellation(event.data.object);
                    break;
                case 'invoice.payment_succeeded':
                    this.handlePaymentSucceeded(event.data.object);
                    break;
                case 'invoice.payment_failed':
                    this.handlePaymentFailed(event.data.object);
                    break;
                default:
                    this.logger.log(`Unhandled webhook event type: ${event.type}`);
            }
        }
        catch (error) {
            this.logger.error(`Error processing webhook event ${event.type}:`, error);
            throw error;
        }
    }
    async handleSubscriptionUpdate(stripeSubscription) {
        const userId = stripeSubscription.metadata?.userId;
        if (!userId) {
            this.logger.warn('No userId found in subscription metadata');
            return;
        }
        const subscription = await this.getOrCreateSubscription(userId);
        const priceId = stripeSubscription.items.data[0]?.price?.id;
        const plan = this.getPlanFromPriceId(priceId);
        subscription.stripeSubscriptionId = stripeSubscription.id;
        subscription.stripeCustomerId = stripeSubscription.customer;
        subscription.plan = plan;
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
        await this.subscriptionRepository.save(subscription);
        this.logger.log(`Updated subscription for user ${userId}: ${plan}`);
    }
    async handleSubscriptionCancellation(stripeSubscription) {
        const userId = stripeSubscription.metadata?.userId;
        if (!userId) {
            this.logger.warn('No userId found in subscription metadata');
            return;
        }
        const subscription = await this.getOrCreateSubscription(userId);
        subscription.status = subscription_entity_1.SubscriptionStatus.CANCELED;
        subscription.plan = 'free';
        subscription.cancelAtPeriodEnd = false;
        await this.subscriptionRepository.save(subscription);
        this.logger.log(`Canceled subscription for user ${userId}`);
    }
    handlePaymentSucceeded(invoice) {
        this.logger.log(`Payment succeeded for invoice ${invoice.id}`);
    }
    handlePaymentFailed(invoice) {
        this.logger.log(`Payment failed for invoice ${invoice.id}`);
    }
    getPlanFromPriceId(priceId) {
        for (const plan of this.pricingPlans) {
            if (plan.stripePriceMonthlyId === priceId ||
                plan.stripePriceYearlyId === priceId) {
                return plan.name;
            }
        }
        return 'free';
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
    async createPaymentLink(userId, priceId) {
        try {
            this.logger.log(`🔗 Creating payment link for user ${userId}, price: ${priceId}`);
            const subscription = await this.getOrCreateSubscription(userId);
            let customerId = subscription.stripeCustomerId;
            if (!customerId) {
                this.logger.log(`🆕 Creating new Stripe customer for payment link`);
                const user = await this.userRepository.findOne({
                    where: { id: userId },
                });
                if (!user) {
                    throw new Error(`User not found for id ${userId}`);
                }
                const name = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : undefined;
                const customer = await this.stripeService.createCustomer(user.email, name);
                customerId = customer.id;
                subscription.stripeCustomerId = customerId;
                await this.subscriptionRepository.save(subscription);
                this.logger.log(`✅ Created customer for payment link: ${customerId}`);
            }
            const paymentLink = await this.stripeService.createPaymentLink(userId, priceId, customerId);
            this.logger.log(`✅ Payment link created: ${paymentLink.paymentLinkId}`);
            return {
                paymentLinkId: paymentLink.paymentLinkId,
                url: paymentLink.url,
            };
        }
        catch (error) {
            this.logger.error(`❌ Payment link creation failed:`, {
                error: error.message,
                code: error.code,
                type: error.type,
                userId,
                priceId,
            });
            throw new common_1.HttpException(`Failed to create payment link: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
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
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        stripe_service_1.StripeService,
        razorpay_service_1.RazorpayService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map