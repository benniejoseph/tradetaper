"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const trades_service_1 = require("./trades.service");
describe('TradesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [trades_service_1.TradesService],
        }).compile();
        service = module.get(trades_service_1.TradesService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=trades.service.spec.skip.js.map