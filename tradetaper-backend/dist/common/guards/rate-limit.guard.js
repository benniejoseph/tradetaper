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
exports.TradingRateLimit = exports.StrictRateLimit = exports.ApiRateLimit = exports.AuthRateLimit = exports.RateLimitGuard = exports.RateLimit = exports.RATE_LIMIT_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const common_2 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
exports.RATE_LIMIT_KEY = 'rateLimit';
const RateLimit = (options) => {
    return (target, propertyKey, descriptor) => {
        if (descriptor) {
            Reflect.defineMetadata(exports.RATE_LIMIT_KEY, options, descriptor.value);
        }
        else {
            Reflect.defineMetadata(exports.RATE_LIMIT_KEY, options, target);
        }
    };
};
exports.RateLimit = RateLimit;
let RateLimitGuard = class RateLimitGuard {
    reflector;
    cacheManager;
    constructor(reflector, cacheManager) {
        this.reflector = reflector;
        this.cacheManager = cacheManager;
    }
    async canActivate(context) {
        const options = this.reflector.get(exports.RATE_LIMIT_KEY, context.getHandler()) ||
            this.reflector.get(exports.RATE_LIMIT_KEY, context.getClass());
        if (!options) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        if (options.skipIf && options.skipIf(request)) {
            return true;
        }
        const key = options.keyGenerator
            ? options.keyGenerator(request)
            : this.getDefaultKey(request);
        const now = Date.now();
        const windowStart = now - options.windowMs;
        const requestTimestamps = (await this.cacheManager.get(key)) || [];
        const validTimestamps = requestTimestamps.filter((timestamp) => timestamp > windowStart);
        if (validTimestamps.length >= options.maxRequests) {
            const oldestTimestamp = Math.min(...validTimestamps);
            const retryAfter = Math.ceil((oldestTimestamp + options.windowMs - now) / 1000);
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message: options.message || 'Too many requests',
                retryAfter,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        validTimestamps.push(now);
        await this.cacheManager.set(key, validTimestamps, options.windowMs);
        return true;
    }
    getDefaultKey(request) {
        const ip = request.ip || request.connection.remoteAddress || 'unknown';
        const userId = request.user?.id || 'anonymous';
        const endpoint = `${request.method}:${request.path}`;
        return `rate_limit:${userId}:${ip}:${endpoint}`;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_2.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [core_1.Reflector, Object])
], RateLimitGuard);
const AuthRateLimit = () => (0, exports.RateLimit)({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again later.',
});
exports.AuthRateLimit = AuthRateLimit;
const ApiRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'API rate limit exceeded. Please slow down.',
});
exports.ApiRateLimit = ApiRateLimit;
const StrictRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Rate limit exceeded for sensitive operation.',
});
exports.StrictRateLimit = StrictRateLimit;
const TradingRateLimit = () => (0, exports.RateLimit)({
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Trading operation rate limit exceeded.',
});
exports.TradingRateLimit = TradingRateLimit;
//# sourceMappingURL=rate-limit.guard.js.map