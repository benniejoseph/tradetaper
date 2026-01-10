"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleWebSocketModule = void 0;
const common_1 = require("@nestjs/common");
const simple_trades_gateway_1 = require("./simple-trades.gateway");
const ict_gateway_1 = require("./ict.gateway");
const market_intelligence_module_1 = require("../market-intelligence/market-intelligence.module");
let SimpleWebSocketModule = class SimpleWebSocketModule {
};
exports.SimpleWebSocketModule = SimpleWebSocketModule;
exports.SimpleWebSocketModule = SimpleWebSocketModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => market_intelligence_module_1.MarketIntelligenceModule)],
        providers: [simple_trades_gateway_1.SimpleTradesGateway, ict_gateway_1.ICTGateway],
        exports: [simple_trades_gateway_1.SimpleTradesGateway, ict_gateway_1.ICTGateway],
    })
], SimpleWebSocketModule);
//# sourceMappingURL=simple-websocket.module.js.map