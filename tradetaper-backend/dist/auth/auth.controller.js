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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const axios_1 = __importDefault(require("axios"));
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const register_user_dto_1 = require("./dto/register-user.dto");
const login_user_dto_1 = require("./dto/login-user.dto");
const user_response_dto_1 = require("../users/dto/user-response.dto");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let AuthController = AuthController_1 = class AuthController {
    authService;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthController_1.name);
    constructor(authService, jwtService, configService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(registerUserDto) {
        return this.authService.register(registerUserDto);
    }
    async login(loginUserDto) {
        const user = await this.authService.validateUser(loginUserDto.email, loginUserDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }
    async googleAuth(res) {
        try {
            const clientId = this.configService.get('GOOGLE_CLIENT_ID');
            const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL');
            if (!clientId || !callbackUrl) {
                throw new common_1.HttpException('Google OAuth not configured', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const scope = 'email profile';
            const state = Math.random().toString(36).substring(7);
            const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${encodeURIComponent(clientId)}&` +
                `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
                `response_type=code&` +
                `scope=${encodeURIComponent(scope)}&` +
                `state=${state}&` +
                `access_type=offline&` +
                `prompt=consent`;
            this.logger.log(`Redirecting to Google OAuth: ${googleAuthUrl}`);
            return res.redirect(googleAuthUrl);
        }
        catch (error) {
            this.logger.error('Error initiating Google OAuth', error);
            throw new common_1.HttpException('Failed to initiate Google OAuth', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async googleCallback(query, res) {
        try {
            const { code, error, state } = query;
            if (error) {
                this.logger.error(`Google OAuth error: ${error}`);
                throw new common_1.BadRequestException(`Google OAuth error: ${error}`);
            }
            if (!code) {
                throw new common_1.BadRequestException('No authorization code received');
            }
            this.logger.log('Received authorization code, exchanging for tokens...');
            const tokens = await this.exchangeCodeForTokens(code);
            this.logger.log('Successfully exchanged code for tokens');
            const userInfo = await this.getUserInfo(tokens.access_token);
            this.logger.log(`Retrieved user info from Google: ${userInfo.email}`);
            const result = await this.authService.validateOrCreateGoogleUser({
                email: userInfo.email,
                firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || '',
                lastName: userInfo.family_name ||
                    userInfo.name?.split(' ').slice(1).join(' ') ||
                    '',
                googleId: userInfo.sub,
                picture: userInfo.picture,
            });
            this.logger.log(`User authenticated successfully: ${result.user.email}`);
            const frontendUrl = this.configService.get('FRONTEND_URL') ||
                'http://localhost:3000';
            const redirectUrl = `${frontendUrl}/auth/google/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`;
            return res.redirect(redirectUrl);
        }
        catch (error) {
            this.logger.error('Google OAuth callback error', error);
            const frontendUrl = this.configService.get('FRONTEND_URL') ||
                'http://localhost:3000';
            const errorUrl = `${frontendUrl}/auth/google/callback?error=${encodeURIComponent(error.message)}`;
            return res.redirect(errorUrl);
        }
    }
    async exchangeCodeForTokens(code) {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const callbackUrl = this.configService.get('GOOGLE_CALLBACK_URL');
        try {
            const response = await axios_1.default.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: callbackUrl,
                grant_type: 'authorization_code',
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Token exchange error:', error.response?.data || error.message);
            throw new common_1.HttpException('Failed to exchange code for tokens', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserInfo(accessToken) {
        try {
            const response = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('User info fetch error:', error.response?.data || error.message);
            throw new common_1.HttpException('Failed to fetch user info from Google', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async debugGoogleConfig() {
        return {
            hasClientId: !!this.configService.get('GOOGLE_CLIENT_ID'),
            hasClientSecret: !!this.configService.get('GOOGLE_CLIENT_SECRET'),
            hasCallbackUrl: !!this.configService.get('GOOGLE_CALLBACK_URL'),
            callbackUrl: this.configService.get('GOOGLE_CALLBACK_URL'),
        };
    }
    async testRoute() {
        return {
            message: 'Test route working',
            timestamp: new Date().toISOString(),
        };
    }
    async adminLogin(loginDto) {
        const adminCredentials = {
            email: 'admin@tradetaper.com',
            password: 'admin123',
        };
        if (loginDto.email !== adminCredentials.email ||
            loginDto.password !== adminCredentials.password) {
            throw new common_1.UnauthorizedException('Invalid admin credentials');
        }
        const payload = {
            email: adminCredentials.email,
            sub: 'admin-user-id',
            role: 'admin',
        };
        const accessToken = this.jwtService.sign(payload);
        return {
            accessToken,
            user: {
                id: 'admin-user-id',
                email: adminCredentials.email,
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    }
    getProfile(req) {
        return req.user;
    }
    async testOauthRoutes() {
        return {
            message: 'OAuth routes test',
            routes: ['google', 'google-callback', 'debug/google-config'],
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_user_dto_1.RegisterUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_user_dto_1.LoginUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('google'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleAuth", null);
__decorate([
    (0, common_1.Get)('google/callback'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "googleCallback", null);
__decorate([
    (0, common_1.Get)('debug/google-config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "debugGoogleConfig", null);
__decorate([
    (0, common_1.Get)('test-route'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "testRoute", null);
__decorate([
    (0, common_1.Post)('admin/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, rate_limit_guard_1.StrictRateLimit)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", user_response_dto_1.UserResponseDto)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('test-oauth-routes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "testOauthRoutes", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map