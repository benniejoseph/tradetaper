"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const user_entity_1 = require("./entities/user.entity");
const account_entity_1 = require("./entities/account.entity");
const users_service_1 = require("./users.service");
const accounts_service_1 = require("./accounts.service");
const accounts_controller_1 = require("./accounts.controller");
const config_1 = require("@nestjs/config");
const mt5_account_entity_1 = require("./entities/mt5-account.entity");
const mt5_accounts_service_1 = require("./mt5-accounts.service");
const mt5_accounts_controller_1 = require("./mt5-accounts.controller");
const trade_history_parser_service_1 = require("./trade-history-parser.service");
const cache_manager_1 = require("@nestjs/cache-manager");
const trades_module_1 = require("../trades/trades.module");
const metaapi_service_1 = require("./metaapi.service");
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, account_entity_1.Account, mt5_account_entity_1.MT5Account]),
            config_1.ConfigModule,
            cache_manager_1.CacheModule.register({
                ttl: 24 * 60 * 60 * 1000,
                max: 100,
            }),
            (0, common_1.forwardRef)(() => trades_module_1.TradesModule),
        ],
        providers: [
            users_service_1.UsersService,
            accounts_service_1.AccountsService,
            mt5_accounts_service_1.MT5AccountsService,
            metaapi_service_1.MetaApiService,
            trade_history_parser_service_1.TradeHistoryParserService,
        ],
        exports: [
            users_service_1.UsersService,
            accounts_service_1.AccountsService,
            mt5_accounts_service_1.MT5AccountsService,
            metaapi_service_1.MetaApiService,
            trade_history_parser_service_1.TradeHistoryParserService,
        ],
        controllers: [accounts_controller_1.AccountsController, mt5_accounts_controller_1.MT5AccountsController],
    })
], UsersModule);
//# sourceMappingURL=users.module.js.map