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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const media_service_1 = require("./media.service");
let MediaController = class MediaController {
    mediaService;
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    async uploadFile(file, noteId, req) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        if (!noteId) {
            throw new common_1.BadRequestException('Note ID is required');
        }
        return this.mediaService.uploadFile(file, noteId, req.user.id);
    }
    async getSignedUrl(mediaId, req) {
        const url = await this.mediaService.getSignedUrl(mediaId, req.user.id);
        return { url };
    }
    async deleteFile(mediaId, req) {
        return this.mediaService.deleteFile(mediaId, req.user.id);
    }
    async getMediaByNote(noteId, req) {
        return this.mediaService.getMediaByNote(noteId, req.user.id);
    }
    generateEmbedData(url) {
        if (!url) {
            throw new common_1.BadRequestException('URL is required');
        }
        return {
            title: 'External Content',
            description: 'Content from external URL',
            thumbnail: '',
        };
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('noteId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(':mediaId/url'),
    __param(0, (0, common_1.Param)('mediaId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getSignedUrl", null);
__decorate([
    (0, common_1.Delete)(':mediaId'),
    __param(0, (0, common_1.Param)('mediaId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Get)('note/:noteId'),
    __param(0, (0, common_1.Param)('noteId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getMediaByNote", null);
__decorate([
    (0, common_1.Post)('embed'),
    __param(0, (0, common_1.Body)('url')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], MediaController.prototype, "generateEmbedData", null);
exports.MediaController = MediaController = __decorate([
    (0, common_1.Controller)('notes/media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map