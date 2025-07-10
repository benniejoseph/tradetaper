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
exports.Tag = void 0;
const user_entity_1 = require("../../users/entities/user.entity");
const trade_entity_1 = require("../../trades/entities/trade.entity");
const class_transformer_1 = require("class-transformer");
const typeorm_1 = require("typeorm");
let Tag = class Tag {
    id;
    name;
    user;
    userId;
    color;
    trades;
    createdAt;
    updatedAt;
};
exports.Tag = Tag;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tag.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Tag.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], Tag.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Tag.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 7, default: '#cccccc' }),
    __metadata("design:type", String)
], Tag.prototype, "color", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => trade_entity_1.Trade),
    (0, class_transformer_1.Exclude)({ toPlainOnly: true }),
    (0, typeorm_1.ManyToMany)(() => trade_entity_1.Trade, (trade) => trade.tags),
    __metadata("design:type", Array)
], Tag.prototype, "trades", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Tag.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Tag.prototype, "updatedAt", void 0);
exports.Tag = Tag = __decorate([
    (0, typeorm_1.Entity)('tags'),
    (0, typeorm_1.Index)(['userId', 'name'], { unique: true })
], Tag);
//# sourceMappingURL=tag.entity.js.map