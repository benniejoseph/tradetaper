"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const seed_service_1 = require("./seed.service");
const production_seed_service_1 = require("./production-seed.service");
const test_user_seed_service_1 = require("./test-user-seed.service");
const user_entity_1 = require("../users/entities/user.entity");
const trade_entity_1 = require("../trades/entities/trade.entity");
const subscription_entity_1 = require("../subscriptions/entities/subscription.entity");
const tag_entity_1 = require("../tags/entities/tag.entity");
const mt5_account_entity_1 = require("../users/entities/mt5-account.entity");
const strategy_entity_1 = require("../strategies/entities/strategy.entity");
const users_module_1 = require("../users/users.module");
let SeedModule = class SeedModule {
};
exports.SeedModule = SeedModule;
exports.SeedModule = SeedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                trade_entity_1.Trade,
                subscription_entity_1.Subscription,
                tag_entity_1.Tag,
                mt5_account_entity_1.MT5Account,
                strategy_entity_1.Strategy,
            ]),
            users_module_1.UsersModule,
        ],
        providers: [seed_service_1.SeedService, production_seed_service_1.ProductionSeedService, test_user_seed_service_1.TestUserSeedService],
        exports: [seed_service_1.SeedService, production_seed_service_1.ProductionSeedService, test_user_seed_service_1.TestUserSeedService],
    })
], SeedModule);
//# sourceMappingURL=seed.module.js.map