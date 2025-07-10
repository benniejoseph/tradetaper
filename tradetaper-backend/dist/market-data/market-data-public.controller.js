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
var MarketDataPublicController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataPublicController = void 0;
const common_1 = require("@nestjs/common");
const multi_provider_service_1 = require("./multi-provider.service");
let MarketDataPublicController = MarketDataPublicController_1 = class MarketDataPublicController {
    multiProviderService;
    logger = new common_1.Logger(MarketDataPublicController_1.name);
    constructor(multiProviderService) {
        this.multiProviderService = multiProviderService;
    }
    async getProviderStatus() {
        this.logger.log('[MarketDataPublicController] Getting provider status');
        return this.multiProviderService.getProviderStatus();
    }
    async testProviders() {
        this.logger.log('[MarketDataPublicController] Testing all providers');
        return this.multiProviderService.testAllProviders();
    }
};
exports.MarketDataPublicController = MarketDataPublicController;
__decorate([
    (0, common_1.Get)('providers/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketDataPublicController.prototype, "getProviderStatus", null);
__decorate([
    (0, common_1.Get)('providers/test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MarketDataPublicController.prototype, "testProviders", null);
exports.MarketDataPublicController = MarketDataPublicController = MarketDataPublicController_1 = __decorate([
    (0, common_1.Controller)('market-data'),
    __metadata("design:paramtypes", [multi_provider_service_1.MultiProviderMarketDataService])
], MarketDataPublicController);
//# sourceMappingURL=market-data-public.controller.js.map