// src/common/guards/rate-limit.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipIf?: (req: any) => boolean; // Skip rate limiting if condition is true
  message?: string; // Custom error message
}

export const RATE_LIMIT_KEY = 'rateLimit';

export const RateLimit = (options: RateLimitOptions) => {
  return (
    target: object,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
    } else {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, target);
    }
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options =
      this.reflector.get<RateLimitOptions>(
        RATE_LIMIT_KEY,
        context.getHandler(),
      ) ||
      this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, context.getClass());

    if (!options) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest();

    // Skip if condition is met
    if (options.skipIf && options.skipIf(request)) {
      return true;
    }

    // Generate cache key
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : this.getDefaultKey(request);

    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Get current request timestamps
    const requestTimestamps: number[] =
      (await this.cacheManager.get(key)) || [];

    // Filter out expired timestamps
    const validTimestamps = requestTimestamps.filter(
      (timestamp) => timestamp > windowStart,
    );

    // Check if limit exceeded
    if (validTimestamps.length >= options.maxRequests) {
      const oldestTimestamp = Math.min(...validTimestamps);
      const retryAfter = Math.ceil(
        (oldestTimestamp + options.windowMs - now) / 1000,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: options.message || 'Too many requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp and save
    validTimestamps.push(now);
    await this.cacheManager.set(key, validTimestamps, options.windowMs);

    return true;
  }

  private getDefaultKey(request: Record<string, any>): string {
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const userId = request.user?.id || 'anonymous';
    const endpoint = `${request.method}:${request.path}`;
    return `rate_limit:${userId}:${ip}:${endpoint}`;
  }
}

// Predefined rate limit decorators for common use cases
export const AuthRateLimit = () =>
  RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
  });

export const ApiRateLimit = () =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'API rate limit exceeded. Please slow down.',
  });

export const StrictRateLimit = () =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    message: 'Rate limit exceeded for sensitive operation.',
  });

export const TradingRateLimit = () =>
  RateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 trade operations per minute
    message: 'Trading operation rate limit exceeded.',
  });
