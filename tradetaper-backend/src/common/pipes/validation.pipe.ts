// src/common/pipes/validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import DOMPurify from 'isomorphic-dompurify';

interface EnhancedValidationOptions extends ValidationPipeOptions {
  sanitize?: boolean;
  maxSize?: number;
  allowedMimeTypes?: string[];
}

@Injectable()
export class EnhancedValidationPipe implements PipeTransform<any> {
  private readonly validationPipe: NestValidationPipe;
  private readonly options: EnhancedValidationOptions;

  constructor(options: EnhancedValidationOptions = {}) {
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      sanitize: true,
      ...options,
    };

    this.validationPipe = new NestValidationPipe(this.options);
  }

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    // First, run standard validation
    const transformedValue = await this.validationPipe.transform(value, metadata);

    // If sanitization is enabled, sanitize string fields
    if (this.options.sanitize && transformedValue && typeof transformedValue === 'object') {
      return this.sanitizeObject(transformedValue);
    }

    return transformedValue;
  }

  private sanitizeObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Sanitize HTML and remove potentially dangerous content
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    // Remove HTML tags and potentially dangerous content
    let sanitized = DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
    
    // Additional sanitization rules
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remove any remaining angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .trim();

    return sanitized;
  }
}

// Predefined validation pipes for common use cases
export const StrictValidationPipe = new EnhancedValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  sanitize: true,
  disableErrorMessages: false,
});

export const SanitizingValidationPipe = new EnhancedValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: false,
  transform: true,
  sanitize: true,
  disableErrorMessages: false,
});

// Additional security validation functions
export class SecurityValidators {
  static validatePassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  static validateSymbol(symbol: string): boolean {
    // Allow alphanumeric and common trading symbols
    const symbolRegex = /^[A-Z0-9._-]{1,20}$/i;
    return symbolRegex.test(symbol);
  }

  static validateCurrency(currency: string): boolean {
    // ISO 4217 currency codes (3 letters)
    const currencyRegex = /^[A-Z]{3}$/;
    return currencyRegex.test(currency);
  }

  static validateNumericRange(value: number, min: number, max: number): boolean {
    return !isNaN(value) && value >= min && value <= max;
  }

  static validateDateRange(date: Date, minDate?: Date, maxDate?: Date): boolean {
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

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  static validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  static validateFileSize(size: number, maxSize: number): boolean {
    return size > 0 && size <= maxSize;
  }

  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  static sanitizeSearchQuery(query: string): string {
    return query
      .replace(/[^\w\s-_.]/g, '') // Remove special characters except word chars, spaces, hyphens, underscores, dots
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 100); // Limit length
  }

  static validateIPAddress(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
    
    if (ipv4Regex.test(ip)) {
      return ip.split('.').every(octet => {
        const num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    return ipv6Regex.test(ip);
  }

  static validateUserAgent(userAgent: string): boolean {
    // Basic user agent validation - not empty and reasonable length
    return Boolean(userAgent && userAgent.length > 0 && userAgent.length <= 1000);
  }

  static detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(;|\-\-|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /'[^']*'/,
      /\bxp_\w+/i,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }

  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src[^>]*>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
  }

  static validateJSONStructure(json: string, maxDepth: number = 10): boolean {
    try {
      const parsed = JSON.parse(json);
      return this.checkObjectDepth(parsed, maxDepth);
    } catch {
      return false;
    }
  }

  private static checkObjectDepth(obj: any, maxDepth: number, currentDepth: number = 0): boolean {
    if (currentDepth > maxDepth) {
      return false;
    }

    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.every(item => this.checkObjectDepth(item, maxDepth, currentDepth + 1));
      } else {
        return Object.values(obj).every(value => 
          this.checkObjectDepth(value, maxDepth, currentDepth + 1)
        );
      }
    }

    return true;
  }
}