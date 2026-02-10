import { PipeTransform, ArgumentMetadata, ValidationPipeOptions } from '@nestjs/common';
interface EnhancedValidationOptions extends ValidationPipeOptions {
    sanitize?: boolean;
    maxSize?: number;
    allowedMimeTypes?: string[];
}
export declare class EnhancedValidationPipe implements PipeTransform<any> {
    private readonly validationPipe;
    private readonly options;
    constructor(options?: EnhancedValidationOptions);
    transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown>;
    private sanitizeObject;
    private sanitizeString;
}
export declare const StrictValidationPipe: EnhancedValidationPipe;
export declare const SanitizingValidationPipe: EnhancedValidationPipe;
export declare class SecurityValidators {
    static validatePassword(password: string): boolean;
    static validateEmail(email: string): boolean;
    static validateSymbol(symbol: string): boolean;
    static validateCurrency(currency: string): boolean;
    static validateNumericRange(value: number, min: number, max: number): boolean;
    static validateDateRange(date: Date, minDate?: Date, maxDate?: Date): boolean;
    static sanitizeFilename(filename: string): string;
    static validateFileType(filename: string, allowedTypes: string[]): boolean;
    static validateFileSize(size: number, maxSize: number): boolean;
    static isValidUUID(uuid: string): boolean;
    static sanitizeSearchQuery(query: string): string;
    static validateIPAddress(ip: string): boolean;
    static validateUserAgent(userAgent: string): boolean;
    static detectSQLInjection(input: string): boolean;
    static detectXSS(input: string): boolean;
    static validateJSONStructure(json: string, maxDepth?: number): boolean;
    private static checkObjectDepth;
}
export {};
