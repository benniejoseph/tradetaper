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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
let AuthService = AuthService_1 = class AuthService {
    usersService;
    jwtService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(email, pass) {
        try {
            this.logger.debug(`Validating user: ${email}`);
            const user = await this.usersService.findOneByEmail(email);
            if (!user) {
                this.logger.debug(`User not found: ${email}`);
                return null;
            }
            this.logger.debug(`User found, validating password for: ${email}`);
            const isPasswordValid = await user.validatePassword(pass);
            if (!isPasswordValid) {
                this.logger.debug(`Invalid password for user: ${email}`);
                return null;
            }
            this.logger.debug(`Password validated successfully for user: ${email}`);
            return user;
        }
        catch (error) {
            this.logger.error(`Error validating user ${email}: ${error.message}`, error.stack);
            return null;
        }
    }
    async validateOrCreateGoogleUser(googleUser) {
        try {
            this.logger.log(`Google OAuth login attempt for: ${googleUser.email}`);
            let user = await this.usersService.findOneByEmail(googleUser.email);
            if (!user) {
                this.logger.log(`Creating new user from Google OAuth: ${googleUser.email}`);
                user = await this.usersService.createGoogleUser({
                    email: googleUser.email,
                    firstName: googleUser.firstName,
                    lastName: googleUser.lastName,
                });
            }
            else {
                this.logger.log(`Existing user found for Google OAuth: ${googleUser.email}`);
            }
            try {
                await this.usersService.updateLastLogin(user.id);
            }
            catch (error) {
                this.logger.warn(`Failed to update lastLoginAt for Google user ${user.id}: ${error.message}`);
            }
            const payload = {
                email: user.email,
                sub: user.id,
            };
            const accessToken = this.jwtService.sign(payload, { expiresIn: 86400 });
            const userResponse = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
            this.logger.log(`Google OAuth login successful for: ${user.email}`);
            return {
                accessToken,
                user: userResponse,
            };
        }
        catch (error) {
            this.logger.error(`Google OAuth login failed for ${googleUser.email}: ${error.message}`, error.stack);
            throw new common_1.UnauthorizedException('Google authentication failed');
        }
    }
    async login(user) {
        try {
            this.logger.log(`Login attempt for user: ${user.email}`);
            try {
                await this.usersService.updateLastLogin(user.id);
                this.logger.log(`Updated lastLoginAt for user: ${user.id}`);
            }
            catch (error) {
                this.logger.warn(`Failed to update lastLoginAt for user ${user.id}: ${error.message}`);
            }
            const payload = {
                email: user.email,
                sub: user.id,
            };
            this.logger.log(`Creating JWT token for user: ${user.id}`);
            let accessToken;
            try {
                accessToken = this.jwtService.sign(payload, { expiresIn: 86400 });
                this.logger.log(`JWT token created successfully for user: ${user.id}`);
            }
            catch (error) {
                this.logger.error(`Failed to sign JWT token for user ${user.id}: ${error.message}`, error.stack);
                throw new common_1.UnauthorizedException('Error during token generation');
            }
            const userResponse = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
            this.logger.log(`Login successful for user: ${user.email}`);
            return {
                accessToken,
                user: userResponse,
            };
        }
        catch (error) {
            this.logger.error(`Login failed for user ${user.email}: ${error.message}`, error.stack);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Login failed');
        }
    }
    async register(registerUserDto) {
        const createdUser = await this.usersService.create(registerUserDto);
        return createdUser;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map