import { ConfigService } from '@nestjs/config';
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
export declare class StripeValidationService {
    private configService;
    private readonly logger;
    private stripe;
    constructor(configService: ConfigService);
    validateStripeConfiguration(): Promise<StripeValidationResult>;
    private validateAccount;
    private validateEnvironmentVariables;
    private validatePriceIds;
    private validateWebhookEndpoint;
    private checkProductionReadiness;
    healthCheck(): Promise<{
        healthy: boolean;
        message: string;
    }>;
    getConfigurationSummary(): {
        environment: string;
        keyType: 'test' | 'live' | 'unknown';
        webhookConfigured: boolean;
        priceIds: Record<string, string | null>;
    };
}
