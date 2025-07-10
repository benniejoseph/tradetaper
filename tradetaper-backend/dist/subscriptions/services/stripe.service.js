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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeService = StripeService_1 = class StripeService {
    configService;
    logger = new common_1.Logger(StripeService_1.name);
    stripe;
    constructor(configService) {
        this.configService = configService;
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is required');
        }
        this.stripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2025-06-30.basil',
        });
    }
    getStripe() {
        return this.stripe;
    }
    async createCustomer(email, name) {
        try {
            const customer = await this.stripe.customers.create({
                email,
                name,
            });
            this.logger.log(`Created Stripe customer: ${customer.id}`);
            return customer;
        }
        catch (error) {
            this.logger.error('Failed to create Stripe customer', error);
            throw error;
        }
    }
    async createCheckoutSession(priceId, customerId, successUrl, cancelUrl) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                allow_promotion_codes: true,
                billing_address_collection: 'required',
                automatic_tax: {
                    enabled: true,
                },
            });
            this.logger.log(`Created checkout session: ${session.id}`);
            return session;
        }
        catch (error) {
            this.logger.error('Failed to create checkout session', error);
            throw error;
        }
    }
    async createBillingPortalSession(customerId, returnUrl) {
        try {
            const session = await this.stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl,
            });
            this.logger.log(`Created billing portal session: ${session.id}`);
            return session;
        }
        catch (error) {
            this.logger.error('Failed to create billing portal session', error);
            throw error;
        }
    }
    async getSubscription(subscriptionId) {
        try {
            return await this.stripe.subscriptions.retrieve(subscriptionId);
        }
        catch (error) {
            this.logger.error(`Failed to get subscription ${subscriptionId}`, error);
            throw error;
        }
    }
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
            this.logger.log(`Canceled subscription: ${subscriptionId}`);
            return subscription;
        }
        catch (error) {
            this.logger.error(`Failed to cancel subscription ${subscriptionId}`, error);
            throw error;
        }
    }
    async reactivateSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: false,
            });
            this.logger.log(`Reactivated subscription: ${subscriptionId}`);
            return subscription;
        }
        catch (error) {
            this.logger.error(`Failed to reactivate subscription ${subscriptionId}`, error);
            throw error;
        }
    }
    async updateSubscription(subscriptionId, newPriceId) {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
            const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
                items: [
                    {
                        id: subscription.items.data[0].id,
                        price: newPriceId,
                    },
                ],
                proration_behavior: 'create_prorations',
            });
            this.logger.log(`Updated subscription: ${subscriptionId}`);
            return updatedSubscription;
        }
        catch (error) {
            this.logger.error(`Failed to update subscription ${subscriptionId}`, error);
            throw error;
        }
    }
    async getUpcomingInvoice(customerId) {
        try {
            return await this.stripe.invoices.createPreview({
                customer: customerId,
            });
        }
        catch (error) {
            if (error.code === 'invoice_upcoming_none') {
                return null;
            }
            this.logger.error(`Failed to get upcoming invoice for customer ${customerId}`, error);
            throw error;
        }
    }
    async getCustomerPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            this.logger.error(`Failed to get payment methods for customer ${customerId}`, error);
            throw error;
        }
    }
    constructEvent(payload, signature) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
        }
        try {
            return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (error) {
            this.logger.error('Failed to construct Stripe event', error);
            throw error;
        }
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map