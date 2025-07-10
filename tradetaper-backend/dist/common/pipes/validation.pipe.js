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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidators = exports.SanitizingValidationPipe = exports.StrictValidationPipe = exports.EnhancedValidationPipe = void 0;
const common_1 = require("@nestjs/common");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
let EnhancedValidationPipe = class EnhancedValidationPipe {
    validationPipe;
    options;
    constructor(options = {}) {
        this.options = {
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            disableErrorMessages: false,
            sanitize: true,
            ...options,
        };
        this.validationPipe = new common_1.ValidationPipe(this.options);
    }
    async transform(value, metadata) {
        const transformedValue = await this.validationPipe.transform(value, metadata);
        if (this.options.sanitize &&
            transformedValue &&
            typeof transformedValue === 'object') {
            return this.sanitizeObject(transformedValue);
        }
        return transformedValue;
    }
    sanitizeObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitizeObject(item));
        }
        if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string') {
                    sanitized[key] = this.sanitizeString(value);
                }
                else if (typeof value === 'object') {
                    sanitized[key] = this.sanitizeObject(value);
                }
                else {
                    sanitized[key] = value;
                }
            }
            return sanitized;
        }
        return obj;
    }
    sanitizeString(str) {
        let sanitized = isomorphic_dompurify_1.default.sanitize(str, { ALLOWED_TAGS: [] });
        sanitized = sanitized
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '')
            .trim();
        return sanitized;
    }
};
exports.EnhancedValidationPipe = EnhancedValidationPipe;
exports.EnhancedValidationPipe = EnhancedValidationPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], EnhancedValidationPipe);
exports.StrictValidationPipe = new EnhancedValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    sanitize: true,
    disableErrorMessages: false,
});
exports.SanitizingValidationPipe = new EnhancedValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    sanitize: true,
    disableErrorMessages: false,
});
class SecurityValidators {
    static validatePassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    static validateSymbol(symbol) {
        const symbolRegex = /^[A-Z0-9._-]{1,20}$/i;
        return symbolRegex.test(symbol);
    }
    static validateCurrency(currency) {
        const currencyRegex = /^[A-Z]{3}$/;
        return currencyRegex.test(currency);
    }
    static validateNumericRange(value, min, max) {
        return !isNaN(value) && value >= min && value <= max;
    }
    static validateDateRange(date, minDate, maxDate) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            return false;
        }
        if (minDate && date < minDate) {
            return false;
        }
        if (maxDate && date > maxDate) {
            return false;
        }
        return true;
    }
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 255);
    }
    static validateFileType(filename, allowedTypes) {
        const extension = filename.split('.').pop()?.toLowerCase();
        return extension ? allowedTypes.includes(extension) : false;
    }
    static validateFileSize(size, maxSize) {
        return size > 0 && size <= maxSize;
    }
    static isValidUUID(uuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
    static sanitizeSearchQuery(query) {
        return query
            .replace(/[^\w\s-_.]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
    }
    static validateIPAddress(ip) {
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
        if (ipv4Regex.test(ip)) {
            return ip.split('.').every((octet) => {
                const num = parseInt(octet, 10);
                return num >= 0 && num <= 255;
            });
        }
        return ipv6Regex.test(ip);
    }
    static validateUserAgent(userAgent) {
        return Boolean(userAgent && userAgent.length > 0 && userAgent.length <= 1000);
    }
    static detectSQLInjection(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
            /(;|\-\-|\/\*|\*\/)/,
            /(\b(OR|AND)\b.*=.*)/i,
            /'[^']*'/,
            /\bxp_\w+/i,
        ];
        return sqlPatterns.some((pattern) => pattern.test(input));
    }
    static detectXSS(input) {
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /<iframe[^>]*>.*?<\/iframe>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<img[^>]*src[^>]*>/gi,
            /<object[^>]*>.*?<\/object>/gi,
            /<embed[^>]*>.*?<\/embed>/gi,
        ];
        return xssPatterns.some((pattern) => pattern.test(input));
    }
    static validateJSONStructure(json, maxDepth = 10) {
        try {
            const parsed = JSON.parse(json);
            return this.checkObjectDepth(parsed, maxDepth);
        }
        catch {
            return false;
        }
    }
    static checkObjectDepth(obj, maxDepth, currentDepth = 0) {
        if (currentDepth > maxDepth) {
            return false;
        }
        if (obj && typeof obj === 'object') {
            if (Array.isArray(obj)) {
                return obj.every((item) => this.checkObjectDepth(item, maxDepth, currentDepth + 1));
            }
            else {
                return Object.values(obj).every((value) => this.checkObjectDepth(value, maxDepth, currentDepth + 1));
            }
        }
        return true;
    }
}
exports.SecurityValidators = SecurityValidators;
//# sourceMappingURL=validation.pipe.js.map