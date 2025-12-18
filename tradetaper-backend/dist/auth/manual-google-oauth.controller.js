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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManualGoogleOAuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const axios_1 = __importDefault(require("axios"));
let ManualGoogleOAuthController = class ManualGoogleOAuthController {
    configService;
    authService;
    constructor(configService, authService) {
        this.configService = configService;
        this.authService = authService;
    }
    async googleAuth(res) {
        try {
            const clientId = this.configService.get('GOOGLE_CLIENT_ID');
            const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL');
            if (!clientId || !callbackUrl) {
                throw new common_1.HttpException('Google OAuth not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
                `response_type=code&` +
                `scope=email profile&` +
                `access_type=offline&` +
                `prompt=consent`;
            console.log('Redirecting to Google OAuth:', googleAuthUrl);
            return res.redirect(googleAuthUrl);
        }
        catch (error) {
            console.error('Google OAuth redirect error:', error);
            throw new common_1.HttpException('Failed to initiate Google OAuth', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async googleCallback(code, error, res) {
        try {
            const frontendUrl = this.configService.get('FRONTEND_URL') ||
                'http://localhost:3000';
            if (error) {
                console.error('Google OAuth error:', error);
                const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error)}`;
                return res.redirect(errorUrl);
            }
            if (!code) {
                console.error('No authorization code received');
                const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent('No authorization code received')}`;
                return res.redirect(errorUrl);
            }
            const tokens = await this.exchangeCodeForTokens(code);
            const userInfo = await this.getUserInfo(tokens.access_token);
            const result = await this.authService.validateOrCreateGoogleUser({
                email: userInfo.email,
                firstName: userInfo.given_name,
                lastName: userInfo.family_name,
                picture: userInfo.picture,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
            });
            const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
            return res.redirect(redirectUrl);
        }
        catch (error) {
            console.error('Google OAuth callback error:', error);
            const frontendUrl = this.configService.get('FRONTEND_URL') ||
                'http://localhost:3000';
            const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message || 'Authentication failed')}`;
            return res.redirect(errorUrl);
        }
    }
    async exchangeCodeForTokens(code) {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL');
        const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: 'authorization_code',
            redirect_uri: callbackUrl,
        });
        return response.data;
    }
    async getUserInfo(accessToken) {
        const response = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data;
    }
    async getGoogleConfig() {
        return {
            hasClientId: !!this.configService.get('GOOGLE_CLIENT_ID'),
            hasClientSecret: !!this.configService.get('GOOGLE_CLIENT_SECRET'),
            hasCallbackUrl: !!this.configService.get('GOOGLE_CALLBACK_URL'),
            callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL'),
        };
    }
};
exports.ManualGoogleOAuthController = ManualGoogleOAuthController;
__decorate([
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ManualGoogleOAuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('error')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ManualGoogleOAuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('google/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ManualGoogleOAuthController.prototype, "getGoogleConfig", null);
exports.ManualGoogleOAuthController = ManualGoogleOAuthController = __decorate([
    (0, common_1.Controller)('auth/oauth'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], ManualGoogleOAuthController);
//# sourceMappingURL=manual-google-oauth.controller.js.map