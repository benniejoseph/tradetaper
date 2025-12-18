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
exports.NoteBlock = void 0;
const typeorm_1 = require("typeorm");
let NoteBlock = class NoteBlock {
    id;
    noteId;
    blockType;
    content;
    position;
    createdAt;
    updatedAt;
};
exports.NoteBlock = NoteBlock;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NoteBlock.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'note_id' }),
    __metadata("design:type", String)
], NoteBlock.prototype, "noteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'block_type', length: 50 }),
    __metadata("design:type", String)
], NoteBlock.prototype, "blockType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], NoteBlock.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NoteBlock.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NoteBlock.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], NoteBlock.prototype, "updatedAt", void 0);
exports.NoteBlock = NoteBlock = __decorate([
    (0, typeorm_1.Entity)('note_blocks')
], NoteBlock);
//# sourceMappingURL=note-block.entity.js.map