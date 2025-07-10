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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageLimitGuard = exports.UsageFeature = exports.USAGE_FEATURE_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const subscription_service_1 = require("../services/subscription.service");
exports.USAGE_FEATURE_KEY = 'usageFeature';
const UsageFeature = (feature) => (0, common_1.SetMetadata)(exports.USAGE_FEATURE_KEY, feature);
exports.UsageFeature = UsageFeature;
let UsageLimitGuard = class UsageLimitGuard {
    reflector;
    subscriptionService;
    constructor(reflector, subscriptionService) {
        this.reflector = reflector;
        this.subscriptionService = subscriptionService;
    }
    async canActivate(context) {
        const feature = this.reflector.getAllAndOverride(exports.USAGE_FEATURE_KEY, [context.getHandler(), context.getClass()]);
        if (!feature) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const canUse = await this.subscriptionService.checkUsageLimit(userId, feature);
        if (!canUse) {
            throw new common_1.ForbiddenException(`Usage limit exceeded for ${feature}. Please upgrade your subscription.`);
        }
        return true;
    }
};
exports.UsageLimitGuard = UsageLimitGuard;
exports.UsageLimitGuard = UsageLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        subscription_service_1.SubscriptionService])
], UsageLimitGuard);
//# sourceMappingURL=usage-limit.guard.js.map