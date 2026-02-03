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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strategy = void 0;
const typeorm_1 = require("typeorm");
const enums_1 = require("../../types/enums");
let Strategy = class Strategy {
    id;
    name;
    description;
    checklist;
    tradingSession;
    isActive;
    maxRiskPercent;
    color;
    tags;
    createdAt;
    updatedAt;
    userId;
};
exports.Strategy = Strategy;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Strategy.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Strategy.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Strategy.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], Strategy.prototype, "checklist", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: enums_1.TradingSession,
        nullable: true,
    }),
    __metadata("design:type", String)
], Strategy.prototype, "tradingSession", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Strategy.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 1.0 }),
    __metadata("design:type", Number)
], Strategy.prototype, "maxRiskPercent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7, default: '#3B82F6' }),
    __metadata("design:type", String)
], Strategy.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Strategy.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Strategy.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Strategy.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Strategy.prototype, "userId", void 0);
exports.Strategy = Strategy = __decorate([
    (0, typeorm_1.Entity)('strategies')
], Strategy);
//# sourceMappingURL=strategy.entity.js.map