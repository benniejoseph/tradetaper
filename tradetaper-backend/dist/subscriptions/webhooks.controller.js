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
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const subscription_service_1 = require("./services/subscription.service");
const stripe_service_1 = require("./services/stripe.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    subscriptionService;
    stripeService;
    logger = new common_1.Logger(WebhooksController_1.name);
    constructor(subscriptionService, stripeService) {
        this.subscriptionService = subscriptionService;
        this.stripeService = stripeService;
    }
    async handleStripeWebhook(request, signature) {
        let event;
        try {
            if (!request.rawBody) {
                throw new Error('No raw body found in request');
            }
            event = this.stripeService.constructWebhookEvent(request.rawBody, signature);
        }
        catch (error) {
            this.logger.error(`Webhook signature verification failed: ${error.message}`);
            throw error;
        }
        this.logger.log(`Processing Stripe event: ${event.type}`);
        try {
            await this.subscriptionService.handleWebhookEvent(event);
            return { received: true };
        }
        catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`);
            throw error;
        }
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleStripeWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService,
        stripe_service_1.StripeService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map