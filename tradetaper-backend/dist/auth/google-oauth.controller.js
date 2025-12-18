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
exports.GoogleOAuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GoogleOAuthController = class GoogleOAuthController {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async googleTest() {
        return {
            message: 'Google OAuth test endpoint working',
            timestamp: new Date().toISOString(),
            hasClientId: !!this.configService.get('GOOGLE_CLIENT_ID'),
            hasClientSecret: !!this.configService.get('GOOGLE_CLIENT_SECRET'),
            hasCallbackUrl: !!this.configService.get('GOOGLE_CALLBACK_URL'),
            callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL'),
        };
    }
    async googleManual(res) {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL');
        if (!clientId || !callbackUrl) {
            return res
                .status(500)
                .json({ error: 'Missing Google OAuth configuration' });
        }
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
            `response_type=code&` +
            `scope=email profile&` +
            `access_type=offline&` +
            `prompt=consent`;
        return res.redirect(googleAuthUrl);
    }
};
exports.GoogleOAuthController = GoogleOAuthController;
__decorate([
    (0, common_1.Get)('google-test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GoogleOAuthController.prototype, "googleTest", null);
__decorate([
    (0, common_1.Get)('google-manual'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleOAuthController.prototype, "googleManual", null);
exports.GoogleOAuthController = GoogleOAuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleOAuthController);
//# sourceMappingURL=google-oauth.controller.js.map