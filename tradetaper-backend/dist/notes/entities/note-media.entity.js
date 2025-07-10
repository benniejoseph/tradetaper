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
exports.NoteMedia = void 0;
const typeorm_1 = require("typeorm");
let NoteMedia = class NoteMedia {
    id;
    noteId;
    filename;
    originalName;
    fileType;
    fileSize;
    gcsPath;
    thumbnailPath;
    createdAt;
    get isImage() {
        return this.fileType.startsWith('image/');
    }
    get isVideo() {
        return this.fileType.startsWith('video/');
    }
    get isAudio() {
        return this.fileType.startsWith('audio/');
    }
    get isPdf() {
        return this.fileType === 'application/pdf';
    }
    get humanFileSize() {
        const bytes = Number(this.fileSize);
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    get signedUrl() {
        return null;
    }
    get thumbnailSignedUrl() {
        return null;
    }
};
exports.NoteMedia = NoteMedia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NoteMedia.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'note_id' }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], NoteMedia.prototype, "noteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], NoteMedia.prototype, "filename", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_name', length: 255 }),
    __metadata("design:type", String)
], NoteMedia.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_type', length: 100 }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], NoteMedia.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_size', type: 'bigint' }),
    __metadata("design:type", Number)
], NoteMedia.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'gcs_path', length: 500 }),
    __metadata("design:type", String)
], NoteMedia.prototype, "gcsPath", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'thumbnail_path', length: 500, nullable: true }),
    __metadata("design:type", String)
], NoteMedia.prototype, "thumbnailPath", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NoteMedia.prototype, "createdAt", void 0);
exports.NoteMedia = NoteMedia = __decorate([
    (0, typeorm_1.Entity)('note_media')
], NoteMedia);
//# sourceMappingURL=note-media.entity.js.map