import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface StripeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  priceValidation: Record<string, {
    valid: boolean;
    amount?: number;
    currency?: string;
    productId?: string;
    error?: string;
  }>;
  webhookEndpointValidation?: {
    valid: boolean;
    url?: string;
    events?: string[];
    error?: string;
  };
  accountInfo?: {
    id: string;
    email: string;
    country: string;
    defaultCurrency: string;
    detailsSubmitted: boolean;
    payoutsEnabled: boolean;
  };
}

@Injectable()
export class StripeValidationService {
  private readonly logger = new Logger(StripeValidationService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  /**
   * Comprehensive Stripe configuration validation
   */
  async validateStripeConfiguration(): Promise<StripeValidationResult> {
    const result: StripeValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      priceValidation: {},
    };

    try {
      // Validate account access
      const accountInfo = await this.validateAccount();
      result.accountInfo = accountInfo;

      // Validate required environment variables
      this.validateEnvironmentVariables(result);

      // Validate price IDs
      await this.validatePriceIds(result);

      // Validate webhook endpoint (if configured)
      await this.validateWebhookEndpoint(result);

      // Check for production readiness
      this.checkProductionReadiness(result, accountInfo);

      result.isValid = result.errors.length === 0;

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Stripe API error: ${error.message}`);
      this.logger.error('Stripe validation failed:', error);
    }

    return result;
  }

  /**
   * Validates Stripe account access and retrieves account information
   */
  private async validateAccount(): Promise<StripeValidationResult['accountInfo']> {
    try {
      const account = await this.stripe.accounts.retrieve();
      
      return {
        id: account.id,
        email: account.email || 'Not provided',
        country: account.country || 'Unknown',
        defaultCurrency: account.default_currency || 'Unknown',
        detailsSubmitted: account.details_submitted || false,
        payoutsEnabled: account.payouts_enabled || false,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve Stripe account: ${error.message}`);
    }
  }

  /**
   * Validates required environment variables
   */
  private validateEnvironmentVariables(result: StripeValidationResult): void {
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
    ];

    for (const varName of requiredVars) {
      const value = this.configService.get<string>(varName);
      if (!value || value.trim() === '') {
        result.errors.push(`Missing required environment variable: ${varName}`);
      }
    }

    // Check if using test keys in production
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const stripePublishableKey = this.configService.get<string>('STRIPE_PUBLISHABLE_KEY');

    if (nodeEnv === 'production') {
      if (stripeSecretKey?.startsWith('sk_test_')) {
        result.errors.push('Using Stripe test secret key in production environment');
      }
      if (stripePublishableKey?.startsWith('pk_test_')) {
        result.errors.push('Using Stripe test publishable key in production environment');
      }
    }
  }

  /**
   * Validates all configured price IDs
   */
  private async validatePriceIds(result: StripeValidationResult): Promise<void> {
    const priceIds = [
      { key: 'STRIPE_PRICE_STARTER_MONTHLY', name: 'Starter Monthly' },
      { key: 'STRIPE_PRICE_STARTER_YEARLY', name: 'Starter Yearly' },
      { key: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY', name: 'Professional Monthly' },
      { key: 'STRIPE_PRICE_PROFESSIONAL_YEARLY', name: 'Professional Yearly' },
      { key: 'STRIPE_PRICE_ENTERPRISE_MONTHLY', name: 'Enterprise Monthly' },
      { key: 'STRIPE_PRICE_ENTERPRISE_YEARLY', name: 'Enterprise Yearly' },
    ];

    for (const priceConfig of priceIds) {
      const priceId = this.configService.get<string>(priceConfig.key);
      
      if (!priceId) {
        result.warnings.push(`Missing price ID for ${priceConfig.name} (${priceConfig.key})`);
        continue;
      }

      try {
        const price = await this.stripe.prices.retrieve(priceId);
        result.priceValidation[priceId] = {
          valid: true,
          amount: price.unit_amount || undefined,
          currency: price.currency,
          productId: price.product as string,
        };
        this.logger.log(`✅ Price ${priceConfig.name} validated: ${priceId}`);
      } catch (error) {
        result.priceValidation[priceId] = {
          valid: false,
          error: error.message,
        };
        result.errors.push(`Invalid price ID for ${priceConfig.name}: ${error.message}`);
      }
    }
  }

  /**
   * Validates webhook endpoint configuration
   */
  private async validateWebhookEndpoint(result: StripeValidationResult): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    
    if (!webhookSecret) {
      result.warnings.push('Stripe webhook secret not configured');
      return;
    }

    try {
      // List webhook endpoints to check if any are configured
      const webhookEndpoints = await this.stripe.webhookEndpoints.list({ limit: 10 });
      
      if (webhookEndpoints.data.length === 0) {
        result.warnings.push('No webhook endpoints configured in Stripe dashboard');
        return;
      }

      // Find webhook endpoint that matches our expected URL pattern
      const expectedWebhookUrl = frontendUrl ? `${frontendUrl}/api/v1/subscriptions/webhook` : null;
      const matchingEndpoint = webhookEndpoints.data.find(endpoint => 
        expectedWebhookUrl && endpoint.url.includes('webhook')
      );

      if (matchingEndpoint) {
        result.webhookEndpointValidation = {
          valid: true,
          url: matchingEndpoint.url,
          events: matchingEndpoint.enabled_events,
        };
        this.logger.log(`✅ Webhook endpoint validated: ${matchingEndpoint.url}`);
      } else {
        result.webhookEndpointValidation = {
          valid: false,
          error: 'No matching webhook endpoint found for the application',
        };
        result.warnings.push('Webhook endpoint URL does not match expected pattern');
      }

    } catch (error) {
      result.webhookEndpointValidation = {
        valid: false,
        error: error.message,
      };
      result.warnings.push(`Could not validate webhook endpoints: ${error.message}`);
    }
  }

  /**
   * Checks if Stripe configuration is ready for production
   */
  private checkProductionReadiness(
    result: StripeValidationResult, 
    accountInfo: StripeValidationResult['accountInfo']
  ): void {
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    
    if (nodeEnv !== 'production') {
      return; // Skip production checks for non-production environments
    }

    if (!accountInfo) {
      result.errors.push('Cannot verify production readiness without account information');
      return;
    }

    // Check if account details are submitted
    if (!accountInfo.detailsSubmitted) {
      result.errors.push('Stripe account details not fully submitted - required for production');
    }

    // Check if payouts are enabled
    if (!accountInfo.payoutsEnabled) {
      result.warnings.push('Stripe payouts not enabled - may affect payment processing');
    }

    // Validate that all required price IDs are present for production
    const validPrices = Object.values(result.priceValidation).filter(p => p.valid).length;
    if (validPrices < 2) {
      result.warnings.push('Less than 2 valid price IDs configured - consider adding more subscription options');
    }
  }

  /**
   * Quick health check for Stripe connectivity
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      await this.stripe.accounts.retrieve();
      return { healthy: true, message: 'Stripe API accessible' };
    } catch (error) {
      return { healthy: false, message: `Stripe API error: ${error.message}` };
    }
  }

  /**
   * Get current Stripe configuration summary
   */
  getConfigurationSummary(): {
    environment: string;
    keyType: 'test' | 'live' | 'unknown';
    webhookConfigured: boolean;
    priceIds: Record<string, string | null>;
  } {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    let keyType: 'test' | 'live' | 'unknown' = 'unknown';
    if (stripeSecretKey?.startsWith('sk_test_')) keyType = 'test';
    else if (stripeSecretKey?.startsWith('sk_live_')) keyType = 'live';

    return {
      environment: this.configService.get<string>('NODE_ENV') || 'unknown',
      keyType,
      webhookConfigured: !!webhookSecret,
      priceIds: {
        starterMonthly: this.configService.get<string>('STRIPE_PRICE_STARTER_MONTHLY') || null,
        starterYearly: this.configService.get<string>('STRIPE_PRICE_STARTER_YEARLY') || null,
        professionalMonthly: this.configService.get<string>('STRIPE_PRICE_PROFESSIONAL_MONTHLY') || null,
        professionalYearly: this.configService.get<string>('STRIPE_PRICE_PROFESSIONAL_YEARLY') || null,
        enterpriseMonthly: this.configService.get<string>('STRIPE_PRICE_ENTERPRISE_MONTHLY') || null,
        enterpriseYearly: this.configService.get<string>('STRIPE_PRICE_ENTERPRISE_YEARLY') || null,
      },
    };
  }
}