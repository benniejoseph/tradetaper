"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const market_data_service_1 = require("./market-data.service");
const market_data_controller_1 = require("./market-data.controller");
const market_data_public_controller_1 = require("./market-data-public.controller");
const multi_provider_service_1 = require("./multi-provider.service");
let MarketDataModule = class MarketDataModule {
};
exports.MarketDataModule = MarketDataModule;
exports.MarketDataModule = MarketDataModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            config_1.ConfigModule,
        ],
        providers: [market_data_service_1.MarketDataService, multi_provider_service_1.MultiProviderMarketDataService],
        controllers: [market_data_controller_1.MarketDataController, market_data_public_controller_1.MarketDataPublicController],
        exports: [market_data_service_1.MarketDataService, multi_provider_service_1.MultiProviderMarketDataService],
    })
], MarketDataModule);
//# sourceMappingURL=market-data.module.js.map