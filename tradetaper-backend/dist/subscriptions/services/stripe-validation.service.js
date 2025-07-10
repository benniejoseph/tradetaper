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
var StripeValidationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeValidationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeValidationService = StripeValidationService_1 = class StripeValidationService {
    configService;
    logger = new common_1.Logger(StripeValidationService_1.name);
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
    async validateStripeConfiguration() {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            priceValidation: {},
        };
        try {
            const accountInfo = await this.validateAccount();
            result.accountInfo = accountInfo;
            this.validateEnvironmentVariables(result);
            await this.validatePriceIds(result);
            await this.validateWebhookEndpoint(result);
            this.checkProductionReadiness(result, accountInfo);
            result.isValid = result.errors.length === 0;
        }
        catch (error) {
            result.isValid = false;
            result.errors.push(`Stripe API error: ${error.message}`);
            this.logger.error('Stripe validation failed:', error);
        }
        return result;
    }
    async validateAccount() {
        try {
            const account = await this.stripe.accounts.retrieve();
            return {
                id: account.id,
                email: account.email || 'Not provided',
                country: account.country || 'Unknown',
                defaultCurrency: account.default_currency || 'Unknown',
                detailsSubmitted: account.details_submitted || false,
                payoutsEnabled: account.payouts_enabled || false,
            };
        }
        catch (error) {
            throw new Error(`Failed to retrieve Stripe account: ${error.message}`);
        }
    }
    validateEnvironmentVariables(result) {
        const requiredVars = [
            'STRIPE_SECRET_KEY',
            'STRIPE_PUBLISHABLE_KEY',
            'STRIPE_WEBHOOK_SECRET',
        ];
        for (const varName of requiredVars) {
            const value = this.configService.get(varName);
            if (!value || value.trim() === '') {
                result.errors.push(`Missing required environment variable: ${varName}`);
            }
        }
        const nodeEnv = this.configService.get('NODE_ENV');
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        const stripePublishableKey = this.configService.get('STRIPE_PUBLISHABLE_KEY');
        if (nodeEnv === 'production') {
            if (stripeSecretKey?.startsWith('sk_test_')) {
                result.errors.push('Using Stripe test secret key in production environment');
            }
            if (stripePublishableKey?.startsWith('pk_test_')) {
                result.errors.push('Using Stripe test publishable key in production environment');
            }
        }
    }
    async validatePriceIds(result) {
        const priceIds = [
            { key: 'STRIPE_PRICE_STARTER_MONTHLY', name: 'Starter Monthly' },
            { key: 'STRIPE_PRICE_STARTER_YEARLY', name: 'Starter Yearly' },
            { key: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY', name: 'Professional Monthly' },
            { key: 'STRIPE_PRICE_PROFESSIONAL_YEARLY', name: 'Professional Yearly' },
            { key: 'STRIPE_PRICE_ENTERPRISE_MONTHLY', name: 'Enterprise Monthly' },
            { key: 'STRIPE_PRICE_ENTERPRISE_YEARLY', name: 'Enterprise Yearly' },
        ];
        for (const priceConfig of priceIds) {
            const priceId = this.configService.get(priceConfig.key);
            if (!priceId) {
                result.warnings.push(`Missing price ID for ${priceConfig.name} (${priceConfig.key})`);
                continue;
            }
            try {
                const price = await this.stripe.prices.retrieve(priceId);
                result.priceValidation[priceId] = {
                    valid: true,
                    amount: price.unit_amount || undefined,
                    currency: price.currency,
                    productId: price.product,
                };
                this.logger.log(`✅ Price ${priceConfig.name} validated: ${priceId}`);
            }
            catch (error) {
                result.priceValidation[priceId] = {
                    valid: false,
                    error: error.message,
                };
                result.errors.push(`Invalid price ID for ${priceConfig.name}: ${error.message}`);
            }
        }
    }
    async validateWebhookEndpoint(result) {
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        const frontendUrl = this.configService.get('FRONTEND_URL');
        if (!webhookSecret) {
            result.warnings.push('Stripe webhook secret not configured');
            return;
        }
        try {
            const webhookEndpoints = await this.stripe.webhookEndpoints.list({ limit: 10 });
            if (webhookEndpoints.data.length === 0) {
                result.warnings.push('No webhook endpoints configured in Stripe dashboard');
                return;
            }
            const expectedWebhookUrl = frontendUrl ? `${frontendUrl}/api/v1/subscriptions/webhook` : null;
            const matchingEndpoint = webhookEndpoints.data.find(endpoint => expectedWebhookUrl && endpoint.url.includes('webhook'));
            if (matchingEndpoint) {
                result.webhookEndpointValidation = {
                    valid: true,
                    url: matchingEndpoint.url,
                    events: matchingEndpoint.enabled_events,
                };
                this.logger.log(`✅ Webhook endpoint validated: ${matchingEndpoint.url}`);
            }
            else {
                result.webhookEndpointValidation = {
                    valid: false,
                    error: 'No matching webhook endpoint found for the application',
                };
                result.warnings.push('Webhook endpoint URL does not match expected pattern');
            }
        }
        catch (error) {
            result.webhookEndpointValidation = {
                valid: false,
                error: error.message,
            };
            result.warnings.push(`Could not validate webhook endpoints: ${error.message}`);
        }
    }
    checkProductionReadiness(result, accountInfo) {
        const nodeEnv = this.configService.get('NODE_ENV');
        if (nodeEnv !== 'production') {
            return;
        }
        if (!accountInfo) {
            result.errors.push('Cannot verify production readiness without account information');
            return;
        }
        if (!accountInfo.detailsSubmitted) {
            result.errors.push('Stripe account details not fully submitted - required for production');
        }
        if (!accountInfo.payoutsEnabled) {
            result.warnings.push('Stripe payouts are not enabled - required for production payouts');
        }
    }
    async healthCheck() {
        try {
            await this.stripe.customers.list({ limit: 1 });
            return { healthy: true, message: 'Stripe API connection is healthy' };
        }
        catch (error) {
            return { healthy: false, message: `Stripe API error: ${error.message}` };
        }
    }
    getConfigurationSummary() {
        const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        const keyType = stripeSecretKey?.startsWith('sk_live_') ? 'live'
            : stripeSecretKey?.startsWith('sk_test_') ? 'test'
                : 'unknown';
        const priceIds = {
            starter_monthly: this.configService.get('STRIPE_PRICE_STARTER_MONTHLY') || null,
            starter_yearly: this.configService.get('STRIPE_PRICE_STARTER_YEARLY') || null,
            professional_monthly: this.configService.get('STRIPE_PRICE_PROFESSIONAL_MONTHLY') || null,
            professional_yearly: this.configService.get('STRIPE_PRICE_PROFESSIONAL_YEARLY') || null,
        };
        return {
            environment: this.configService.get('NODE_ENV') || 'development',
            keyType,
            webhookConfigured: !!webhookSecret,
            priceIds,
        };
    }
};
exports.StripeValidationService = StripeValidationService;
exports.StripeValidationService = StripeValidationService = StripeValidationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeValidationService);
//# sourceMappingURL=stripe-validation.service.js.map