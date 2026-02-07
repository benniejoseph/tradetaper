import { AuthenticatedRequest } from '../types/authenticated-request.interface';
import { SubscriptionService, BillingInfo, SubscriptionUsage } from './services/subscription.service';
export declare class CreateRazorpaySubscriptionDto {
    planId: string;
    period: 'monthly' | 'yearly';
}
export declare class SubscriptionsController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
    getPricingPlans(): import("./services/subscription.service").PricingPlan[];
    createRazorpaySubscription(dto: CreateRazorpaySubscriptionDto, req: AuthenticatedRequest): Promise<{
        subscriptionId: any;
        key: string | undefined;
        currency: string;
        name: string;
        description: string;
        customer_id: string;
    }>;
    getCurrentSubscription(req: AuthenticatedRequest): Promise<BillingInfo>;
    getUsage(req: AuthenticatedRequest): SubscriptionUsage;
    checkFeatureAccess(req: AuthenticatedRequest, feature: string): Promise<{
        hasAccess: boolean;
    }>;
}
