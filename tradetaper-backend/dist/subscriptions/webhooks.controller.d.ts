import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './services/subscription.service';
export declare class WebhooksController {
    private readonly subscriptionService;
    private readonly configService;
    private readonly logger;
    private readonly stripe;
    constructor(subscriptionService: SubscriptionService, configService: ConfigService);
    handleStripeWebhook(request: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
}
