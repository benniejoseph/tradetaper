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
exports.Note = void 0;
const typeorm_1 = require("typeorm");
const psychological_insight_entity_1 = require("./psychological-insight.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const account_entity_1 = require("../../users/entities/account.entity");
const trade_entity_1 = require("../../trades/entities/trade.entity");
let Note = class Note {
    id;
    userId;
    accountId;
    tradeId;
    title;
    content;
    tags;
    chartImageUrl;
    chartAnalysisData;
    createdAt;
    updatedAt;
    deletedAt;
    isPinned;
    visibility;
    wordCount;
    readingTime;
    psychologicalTags;
    user;
    account;
    trade;
    psychologicalInsights;
    get preview() {
        if (!this.content || this.content.length === 0)
            return '';
        const textBlocks = this.content.filter((block) => ['text', 'heading', 'quote'].includes(block.type));
        if (textBlocks.length === 0)
            return '';
        const firstBlock = textBlocks[0];
        const text = firstBlock.content?.text || '';
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    }
    get hasMedia() {
        return (this.content?.some((block) => ['image', 'video', 'embed'].includes(block.type)) || false);
    }
    get blockCount() {
        return this.content?.length || 0;
    }
};
exports.Note = Note;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Note.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Note.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_id', nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'trade_id', nullable: true }),
    __metadata("design:type", String)
], Note.prototype, "tradeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Note.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: [] }),
    __metadata("design:type", Array)
], Note.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', array: true, default: [] }),
    __metadata("design:type", Array)
], Note.prototype, "tags", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chart_image_url', nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Note.prototype, "chartImageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'chart_analysis_data', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Note.prototype, "chartAnalysisData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Note.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Note.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Note.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_pinned', default: false }),
    __metadata("design:type", Boolean)
], Note.prototype, "isPinned", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'private' }),
    __metadata("design:type", String)
], Note.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'word_count', default: 0 }),
    __metadata("design:type", Number)
], Note.prototype, "wordCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reading_time', default: 0 }),
    __metadata("design:type", Number)
], Note.prototype, "readingTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true, name: 'psychological_tags' }),
    __metadata("design:type", Array)
], Note.prototype, "psychologicalTags", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Note.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => account_entity_1.Account, { eager: false, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", account_entity_1.Account)
], Note.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => trade_entity_1.Trade, { eager: false, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'trade_id' }),
    __metadata("design:type", trade_entity_1.Trade)
], Note.prototype, "trade", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => psychological_insight_entity_1.PsychologicalInsight, (psychologicalInsight) => psychologicalInsight.note),
    __metadata("design:type", Array)
], Note.prototype, "psychologicalInsights", void 0);
exports.Note = Note = __decorate([
    (0, typeorm_1.Entity)('notes'),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['accountId']),
    (0, typeorm_1.Index)(['tradeId']),
    (0, typeorm_1.Index)(['tags']),
    (0, typeorm_1.Index)(['visibility']),
    (0, typeorm_1.Index)(['isPinned'])
], Note);
//# sourceMappingURL=note.entity.js.map