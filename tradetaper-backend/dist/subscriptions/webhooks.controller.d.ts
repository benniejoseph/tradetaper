import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionService } from './services/subscription.service';
import { StripeService } from './services/stripe.service';
export declare class WebhooksController {
    private readonly subscriptionService;
    private readonly stripeService;
    private readonly logger;
    constructor(subscriptionService: SubscriptionService, stripeService: StripeService);
    handleStripeWebhook(request: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
    }>;
}
