"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const market_data_service_1 = require("./market-data.service");
describe('MarketDataService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [market_data_service_1.MarketDataService],
        }).compile();
        service = module.get(market_data_service_1.MarketDataService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=market-data.service.spec.skip.js.map