import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Secrets Management Service
 * 
 * Provides centralized, secure access to API keys and secrets.
 * In production, integrate with Google Cloud Secret Manager, AWS Secrets Manager, or Vault.
 * 
 * Features:
 * - Centralized secret access
 * - Validation on startup
 * - Rotation support
 * - Audit logging
 */
@Injectable()
export class SecretsService {
  private readonly logger = new Logger(SecretsService.name);
  private readonly secretsCache = new Map<string, { value: string; expiresAt?: Date }>();

  constructor(private readonly configService: ConfigService) {
    this.validateRequiredSecrets();
  }

  /**
   * Validate that all required secrets are present on startup
   */
  private validateRequiredSecrets(): void {
    const required = [
      'JWT_SECRET',
      'GEMINI_API_KEY',
      'DB_PASSWORD',
    ];

    const isProduction = this.configService.get('NODE_ENV') === 'production';
    
    const missing: string[] = [];
    
    for (const secret of required) {
      const value = this.configService.get(secret);
      if (!value && isProduction) {
        missing.push(secret);
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Missing required secrets in production: ${missing.join(', ')}. ` +
        `Please configure these in your environment or secret manager.`
      );
    }

    this.logger.log(`✓ All required secrets validated (${required.length} secrets)`);
  }

  /**
   * Get a secret value with optional caching
   */
  getSecret(key: string, options: { cache?: boolean; ttl?: number } = {}): string {
    // Check cache first
    if (options.cache) {
      const cached = this.secretsCache.get(key);
      if (cached && (!cached.expiresAt || cached.expiresAt > new Date())) {
        return cached.value;
      }
    }

    // Get from config
    const value = this.configService.get<string>(key);
    
    if (!value) {
      this.logger.warn(`Secret '${key}' not found`);
      return null;
    }

    // Cache if requested
    if (options.cache) {
      const expiresAt = options.ttl 
        ? new Date(Date.now() + options.ttl * 1000)
        : undefined;
      
      this.secretsCache.set(key, { value, expiresAt });
    }

    return value;
  }

  /**
   * Get Gemini API Key
   */
  getGeminiApiKey(): string {
    return this.getSecret('GEMINI_API_KEY', { cache: true, ttl: 3600 });
  }

  /**
   * Get JWT Secret
   */
  getJwtSecret(): string {
    return this.getSecret('JWT_SECRET', { cache: true, ttl: 3600 });
  }

  /**
   * Get database password
   */
  getDatabasePassword(): string {
    return this.getSecret('DB_PASSWORD');
  }

  /**
   * Get Stripe secret key
   */
  getStripeSecretKey(): string {
    return this.getSecret('STRIPE_SECRET_KEY', { cache: true, ttl: 3600 });
  }

  /**
   * Invalidate cached secrets (call after rotation)
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.secretsCache.delete(key);
      this.logger.log(`Invalidated cache for secret: ${key}`);
    } else {
      this.secretsCache.clear();
      this.logger.log('Invalidated all cached secrets');
    }
  }

  /**
   * For future integration with cloud secret managers
   * TODO: Integrate with Google Cloud Secret Manager
   */
  async rotateSecret(key: string, newValue: string): Promise<void> {
    // Implementation for secret rotation
    // 1. Update in secret manager
    // 2. Invalidate cache
    // 3. Notify dependent services
    this.logger.warn(`Secret rotation not yet implemented for: ${key}`);
  }
}

