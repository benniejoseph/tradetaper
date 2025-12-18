"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_controller_1 = require("./admin.controller");
const admin_service_1 = require("./admin.service");
const user_entity_1 = require("../users/entities/user.entity");
const account_entity_1 = require("../users/entities/account.entity");
const trade_entity_1 = require("../trades/entities/trade.entity");
const tag_entity_1 = require("../tags/entities/tag.entity");
const mt5_account_entity_1 = require("../users/entities/mt5-account.entity");
const subscription_entity_1 = require("../subscriptions/entities/subscription.entity");
const usage_entity_1 = require("../subscriptions/entities/usage.entity");
const seed_module_1 = require("../seed/seed.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_entity_1.User,
                account_entity_1.Account,
                trade_entity_1.Trade,
                tag_entity_1.Tag,
                mt5_account_entity_1.MT5Account,
                subscription_entity_1.Subscription,
                usage_entity_1.Usage,
            ]),
            seed_module_1.SeedModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map