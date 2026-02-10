import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
export interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (req: any) => string;
    skipIf?: (req: any) => boolean;
    message?: string;
}
export declare const RATE_LIMIT_KEY = "rateLimit";
export declare const RateLimit: (options: RateLimitOptions) => (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private cacheManager;
    constructor(reflector: Reflector, cacheManager: Cache);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getDefaultKey;
}
export declare const AuthRateLimit: () => (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const ApiRateLimit: () => (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const StrictRateLimit: () => (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
export declare const TradingRateLimit: () => (target: object, propertyKey?: string, descriptor?: PropertyDescriptor) => void;
