"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const seed_service_1 = require("./seed.service");
describe('SeedService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [seed_service_1.SeedService],
        }).compile();
        service = module.get(seed_service_1.SeedService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=seed.service.spec.skip.js.map