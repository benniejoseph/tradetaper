"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const market_data_controller_1 = require("./market-data.controller");
describe('MarketDataController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [market_data_controller_1.MarketDataController],
        }).compile();
        controller = module.get(market_data_controller_1.MarketDataController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=market-data.controller.spec.skip.js.map