"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const subscription_entity_1 = require("./entities/subscription.entity");
const usage_entity_1 = require("./entities/usage.entity");
const user_entity_1 = require("../users/entities/user.entity");
const subscription_service_1 = require("./services/subscription.service");
const razorpay_service_1 = require("./services/razorpay.service");
const subscriptions_controller_1 = require("./subscriptions.controller");
let SubscriptionsModule = class SubscriptionsModule {
};
exports.SubscriptionsModule = SubscriptionsModule;
exports.SubscriptionsModule = SubscriptionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([subscription_entity_1.Subscription, usage_entity_1.Usage, user_entity_1.User]),
        ],
        controllers: [subscriptions_controller_1.SubscriptionsController],
        providers: [subscription_service_1.SubscriptionService, razorpay_service_1.RazorpayService],
        exports: [subscription_service_1.SubscriptionService, razorpay_service_1.RazorpayService],
    })
], SubscriptionsModule);
//# sourceMappingURL=subscriptions.module.js.map