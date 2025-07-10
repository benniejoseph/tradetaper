"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentController = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ContentController = class ContentController {
    contentPath = path.join(process.cwd(), 'content');
    async getProductDescription(res) {
        return this.serveContent('PRODUCT_DESCRIPTION.md', res);
    }
    async getTermsOfService(res) {
        return this.serveContent('legal/TERMS_OF_SERVICE.md', res);
    }
    async getPrivacyPolicy(res) {
        return this.serveContent('legal/PRIVACY_POLICY.md', res);
    }
    async getCancellationRefundPolicy(res) {
        return this.serveContent('legal/CANCELLATION_REFUND_POLICY.md', res);
    }
    async getSupportGuide(res) {
        return this.serveContent('support/SUPPORT.md', res);
    }
    async getContentIndex(res) {
        return this.serveContent('INDEX.md', res);
    }
    async getLegalDocument(document, res) {
        const allowedDocuments = ['terms', 'privacy', 'cancellation-refund'];
        if (!allowedDocuments.includes(document)) {
            throw new common_1.HttpException('Document not found', common_1.HttpStatus.NOT_FOUND);
        }
        const fileMap = {
            terms: 'TERMS_OF_SERVICE.md',
            privacy: 'PRIVACY_POLICY.md',
            'cancellation-refund': 'CANCELLATION_REFUND_POLICY.md',
        };
        return this.serveContent(`legal/${fileMap[document]}`, res);
    }
    async serveContent(relativePath, res) {
        try {
            const filePath = path.join(this.contentPath, relativePath);
            if (!filePath.startsWith(this.contentPath)) {
                throw new common_1.HttpException('Invalid file path', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!fs.existsSync(filePath)) {
                throw new common_1.HttpException('Content not found', common_1.HttpStatus.NOT_FOUND);
            }
            const content = fs.readFileSync(filePath, 'utf8');
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.send(content);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Error reading content', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ContentController = ContentController;
__decorate([
    (0, common_1.Get)('product-description'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getProductDescription", null);
__decorate([
    (0, common_1.Get)('legal/terms'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getTermsOfService", null);
__decorate([
    (0, common_1.Get)('legal/privacy'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getPrivacyPolicy", null);
__decorate([
    (0, common_1.Get)('legal/cancellation-refund'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getCancellationRefundPolicy", null);
__decorate([
    (0, common_1.Get)('support'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getSupportGuide", null);
__decorate([
    (0, common_1.Get)('index'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getContentIndex", null);
__decorate([
    (0, common_1.Get)('legal/:document'),
    __param(0, (0, common_1.Param)('document')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContentController.prototype, "getLegalDocument", null);
exports.ContentController = ContentController = __decorate([
    (0, common_1.Controller)('content')
], ContentController);
//# sourceMappingURL=content.controller.js.map