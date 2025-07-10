"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const trades_controller_1 = require("./trades.controller");
describe('TradesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [trades_controller_1.TradesController],
        }).compile();
        controller = module.get(trades_controller_1.TradesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=trades.controller.spec.skip.js.map