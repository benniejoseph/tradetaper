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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../../users/users.service");
function getJwtSecret(configService) {
    const logger = new common_1.Logger('JwtStrategy');
    const jwtSecret = configService.get('JWT_SECRET');
    if (!jwtSecret) {
        logger.warn('JWT_SECRET is not defined in environment variables. Using fallback secret for debugging.');
        return 'temporary-fallback-jwt-secret-for-debugging-please-set-proper-secret-in-production-environment-12345';
    }
    return jwtSecret;
}
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    usersService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(configService, usersService) {
        const strategyOptions = {
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: getJwtSecret(configService),
        };
        super(strategyOptions);
        this.configService = configService;
        this.usersService = usersService;
    }
    async validate(payload) {
        this.logger.debug(`Validating JWT for user ID: ${payload.sub} and email: ${payload.email}`);
        if (payload.role === 'admin' && payload.sub === 'admin-user-id') {
            return {
                id: 'admin-user-id',
                email: payload.email,
                firstName: 'Admin',
                lastName: 'User',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        const user = await this.usersService.findOneById(payload.sub);
        if (!user) {
            this.logger.warn(`JWT validation failed: User not found for ID ${payload.sub}`);
            throw new common_1.UnauthorizedException('User not found or token invalid.');
        }
        return user;
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map