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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsController = exports.CreateRazorpaySubscriptionDto = exports.CreatePaymentLinkDto = exports.CreatePortalSessionDto = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const subscription_service_1 = require("./services/subscription.service");
const create_checkout_session_dto_1 = require("./dto/create-checkout-session.dto");
class CreatePortalSessionDto {
    returnUrl;
}
exports.CreatePortalSessionDto = CreatePortalSessionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreatePortalSessionDto.prototype, "returnUrl", void 0);
class CreatePaymentLinkDto {
    priceId;
}
exports.CreatePaymentLinkDto = CreatePaymentLinkDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePaymentLinkDto.prototype, "priceId", void 0);
class CreateRazorpaySubscriptionDto {
    planId;
    period;
}
exports.CreateRazorpaySubscriptionDto = CreateRazorpaySubscriptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "planId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRazorpaySubscriptionDto.prototype, "period", void 0);
let SubscriptionsController = class SubscriptionsController {
    subscriptionService;
    constructor(subscriptionService) {
        this.subscriptionService = subscriptionService;
    }
    getPricingPlans() {
        return this.subscriptionService.getPricingPlans();
    }
    async createCheckoutSession(createCheckoutSessionDto, req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new Error('User ID not found on request');
        }
        return this.subscriptionService.createCheckoutSession(userId, createCheckoutSessionDto.priceId, createCheckoutSessionDto.successUrl, createCheckoutSessionDto.cancelUrl);
    }
    async createPortalSession(createPortalSessionDto, req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new Error('User ID not found on request');
        }
        return this.subscriptionService.createPortalSession(userId, createPortalSessionDto.returnUrl);
    }
    async createPaymentLink(createPaymentLinkDto, req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new Error('User ID not found on request');
        }
        return this.subscriptionService.createPaymentLink(userId, createPaymentLinkDto.priceId);
    }
    async createRazorpaySubscription(dto, req) {
        return this.subscriptionService.createRazorpaySubscription(req.user.userId, dto.planId, dto.period);
    }
    async getCurrentSubscription(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new Error('User ID not found on request');
        }
        return this.subscriptionService.getCurrentSubscription(userId);
    }
    getUsage(req) {
        const userId = req.user.userId;
        if (!userId) {
            throw new Error('User ID not found on request');
        }
        return this.subscriptionService.getCurrentUsage(userId);
    }
    async checkFeatureAccess(req, feature) {
        const userId = req.user.userId;
        if (!userId) {
            throw new Error('User ID not found on request');
        }
        return {
            hasAccess: await this.subscriptionService.hasFeatureAccess(userId, feature),
        };
    }
};
exports.SubscriptionsController = SubscriptionsController;
__decorate([
    (0, common_1.Get)('pricing-plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SubscriptionsController.prototype, "getPricingPlans", null);
__decorate([
    (0, common_1.Post)('create-checkout-session'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_checkout_session_dto_1.CreateCheckoutSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createCheckoutSession", null);
__decorate([
    (0, common_1.Post)('create-portal-session'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePortalSessionDto, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createPortalSession", null);
__decorate([
    (0, common_1.Post)('create-payment-link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePaymentLinkDto, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createPaymentLink", null);
__decorate([
    (0, common_1.Post)('create-razorpay-subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateRazorpaySubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "createRazorpaySubscription", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "getCurrentSubscription", null);
__decorate([
    (0, common_1.Get)('usage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], SubscriptionsController.prototype, "getUsage", null);
__decorate([
    (0, common_1.Get)('feature-access/:feature'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('feature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionsController.prototype, "checkFeatureAccess", null);
exports.SubscriptionsController = SubscriptionsController = __decorate([
    (0, common_1.Controller)('subscriptions'),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService])
], SubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map