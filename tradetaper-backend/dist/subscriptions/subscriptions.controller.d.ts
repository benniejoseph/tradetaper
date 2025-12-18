import { SubscriptionService, BillingInfo, SubscriptionUsage } from './services/subscription.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { AuthenticatedRequest } from '../types/authenticated-request.interface';
export declare class CreatePortalSessionDto {
    returnUrl: string;
}
export declare class CreatePaymentLinkDto {
    priceId: string;
}
export declare class SubscriptionsController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    getPricingPlans(): import("./services/subscription.service").PricingPlan[];
    createCheckoutSession(createCheckoutSessionDto: CreateCheckoutSessionDto, req: AuthenticatedRequest): Promise<{
        sessionId: string;
        url: string;
    }>;
    createPortalSession(createPortalSessionDto: CreatePortalSessionDto, req: AuthenticatedRequest): Promise<{
        url: string;
    }>;
    createPaymentLink(createPaymentLinkDto: CreatePaymentLinkDto, req: AuthenticatedRequest): Promise<{
        paymentLinkId: string;
        url: string;
    }>;
    getCurrentSubscription(req: AuthenticatedRequest): Promise<BillingInfo>;
    getUsage(req: AuthenticatedRequest): SubscriptionUsage;
    checkFeatureAccess(req: AuthenticatedRequest, feature: string): Promise<{
        hasAccess: boolean;
    }>;
}
