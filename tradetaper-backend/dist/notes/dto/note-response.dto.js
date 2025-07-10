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
exports.NoteResponseDto = void 0;
const class_transformer_1 = require("class-transformer");
class NoteResponseDto {
    id;
    title;
    content;
    tags;
    createdAt;
    updatedAt;
    isPinned;
    visibility;
    wordCount;
    readingTime;
    accountId;
    tradeId;
    account;
    trade;
    get preview() {
        if (!this.content || this.content.length === 0)
            return '';
        const textBlocks = this.content.filter(block => ['text', 'heading', 'quote'].includes(block.type));
        if (textBlocks.length === 0)
            return '';
        const firstBlock = textBlocks[0];
        const text = firstBlock.content?.text || '';
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    }
    get hasMedia() {
        return this.content?.some(block => ['image', 'video', 'embed'].includes(block.type)) || false;
    }
    get blockCount() {
        return this.content?.length || 0;
    }
    userId;
    deletedAt;
}
exports.NoteResponseDto = NoteResponseDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], NoteResponseDto.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], NoteResponseDto.prototype, "title", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], NoteResponseDto.prototype, "content", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], NoteResponseDto.prototype, "tags", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.created_at || obj.createdAt),
    __metadata("design:type", Date)
], NoteResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.updated_at || obj.updatedAt),
    __metadata("design:type", Date)
], NoteResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.is_pinned || obj.isPinned),
    __metadata("design:type", Boolean)
], NoteResponseDto.prototype, "isPinned", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], NoteResponseDto.prototype, "visibility", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.word_count || obj.wordCount),
    __metadata("design:type", Number)
], NoteResponseDto.prototype, "wordCount", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.reading_time || obj.readingTime),
    __metadata("design:type", Number)
], NoteResponseDto.prototype, "readingTime", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.account_id || obj.accountId),
    __metadata("design:type", String)
], NoteResponseDto.prototype, "accountId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => obj.trade_id || obj.tradeId),
    __metadata("design:type", String)
], NoteResponseDto.prototype, "tradeId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], NoteResponseDto.prototype, "account", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], NoteResponseDto.prototype, "trade", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], NoteResponseDto.prototype, "preview", null);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean),
    __metadata("design:paramtypes", [])
], NoteResponseDto.prototype, "hasMedia", null);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [])
], NoteResponseDto.prototype, "blockCount", null);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], NoteResponseDto.prototype, "userId", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", Date)
], NoteResponseDto.prototype, "deletedAt", void 0);
//# sourceMappingURL=note-response.dto.js.map