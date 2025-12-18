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
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    subscriptionRepository;
    userRepository;
    configService;
    stripeService;
    logger = new common_1.Logger(SubscriptionService_1.name);
    pricingPlans;
    constructor(subscriptionRepository, userRepository, configService, stripeService) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.configService = configService;
        this.stripeService = stripeService;
        this.pricingPlans = [
            {
                id: 'starter',
                name: 'starter',
                displayName: 'TradeTaper Starter',
                description: 'Essential trading journal for beginners',
                features: [
                    'Up to 100 trades per month',
                    '3 trading accounts',
                    'Basic analytics',
                    'Trade performance tracking',
                    'Email support',
                ],
                priceMonthly: 999,
                priceYearly: 9999,
                stripePriceMonthlyId: this.configService.get('STRIPE_PRICE_STARTER_MONTHLY') || '',
                stripePriceYearlyId: this.configService.get('STRIPE_PRICE_STARTER_YEARLY') || '',
                stripeProductId: this.configService.get('STRIPE_PRODUCT_STARTER') || '',
                limits: {
                    trades: 100,
                    accounts: 3,
                    marketData: false,
                    analytics: 'basic',
                },
            },
            {
                id: 'professional',
                name: 'professional',
                displayName: 'TradeTaper Professional',
                description: 'Advanced trading journal for serious traders',
                features: [
                    'Unlimited trades',
                    'Unlimited trading accounts',
                    'Advanced analytics & metrics',
                    'Real-time market data',
                    'ICT concepts tracking',
                    'Export capabilities',
                    'Priority support',
                ],
                priceMonthly: 2999,
                priceYearly: 29999,
                stripePriceMonthlyId: this.configService.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY') ||
                    '',
                stripePriceYearlyId: this.configService.get('STRIPE_PRICE_PROFESSIONAL_YEARLY') ||
                    '',
                stripeProductId: this.configService.get('STRIPE_PRODUCT_PROFESSIONAL') || '',
                limits: {
                    trades: 'unlimited',
                    accounts: 'unlimited',
                    marketData: true,
                    analytics: 'advanced',
                },
            },
            {
                id: 'enterprise',
                name: 'enterprise',
                displayName: 'TradeTaper Enterprise',
                description: 'Premium solution for professional traders and institutions',
                features: [
                    'Everything in Professional',
                    'White-label options',
                    'API access',
                    'Custom integrations',
                    'Dedicated account manager',
                    'SLA guarantees',
                    '24/7 priority support',
                ],
                priceMonthly: 9999,
                priceYearly: 99999,
                stripePriceMonthlyId: this.configService.get('STRIPE_PRICE_ENTERPRISE_MONTHLY') ||
                    '',
                stripePriceYearlyId: this.configService.get('STRIPE_PRICE_ENTERPRISE_YEARLY') ||
                    '',
                stripeProductId: this.configService.get('STRIPE_PRODUCT_ENTERPRISE') || '',
                limits: {
                    trades: 'unlimited',
                    accounts: 'unlimited',
                    marketData: true,
                    analytics: 'premium',
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
            accounts: 0,
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
            case 'market_data':
                return plan.limits.marketData;
            case 'unlimited_trades':
                return plan.limits.trades === 'unlimited';
            case 'advanced_analytics':
                return (plan.limits.analytics === 'advanced' ||
                    plan.limits.analytics === 'premium');
            case 'premium_analytics':
                return plan.limits.analytics === 'premium';
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
        const limit = plan.limits[feature];
        if (limit === 'unlimited') {
            return true;
        }
        const usage = subscription.usage[feature];
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
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subscription_entity_1.Subscription)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        stripe_service_1.StripeService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map