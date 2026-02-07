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
exports.AIController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const feature_access_guard_1 = require("../subscriptions/guards/feature-access.guard");
const ai_service_1 = require("./ai.service");
let AIController = class AIController {
    aiService;
    constructor(aiService) {
        this.aiService = aiService;
    }
    async speechToText(file) {
        if (!file) {
            throw new common_1.BadRequestException('No audio file provided');
        }
        const allowedMimeTypes = [
            'audio/mpeg',
            'audio/wav',
            'audio/mp4',
            'audio/ogg',
            'audio/webm',
            'audio/flac',
            'audio/aac',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException('Unsupported audio format');
        }
        return this.aiService.speechToText(file.buffer, file.originalname);
    }
    async enhanceText(body) {
        const { text, task } = body;
        if (!text || !task) {
            throw new common_1.BadRequestException('Text and task are required');
        }
        if (!['grammar', 'clarity', 'summarize', 'expand'].includes(task)) {
            throw new common_1.BadRequestException('Invalid task type');
        }
        return this.aiService.enhanceText(text, task);
    }
    async generateNoteSuggestions(body) {
        const { content } = body;
        if (!content || content.trim().length === 0) {
            throw new common_1.BadRequestException('Content is required');
        }
        return this.aiService.generateNoteSuggestions(content);
    }
};
exports.AIController = AIController;
__decorate([
    (0, common_1.Post)('speech-to-text'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', {
        limits: {
            fileSize: 25 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "speechToText", null);
__decorate([
    (0, common_1.Post)('enhance-text'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "enhanceText", null);
__decorate([
    (0, common_1.Post)('generate-suggestions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIController.prototype, "generateNoteSuggestions", null);
exports.AIController = AIController = __decorate([
    (0, common_1.Controller)('notes/ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, feature_access_guard_1.FeatureAccessGuard),
    (0, feature_access_guard_1.RequireFeature)('aiAnalysis'),
    __metadata("design:paramtypes", [ai_service_1.AIService])
], AIController);
//# sourceMappingURL=ai.controller.js.map