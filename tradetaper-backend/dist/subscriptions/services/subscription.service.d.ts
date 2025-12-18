import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Subscription } from '../entities/subscription.entity';
import { StripeService } from './stripe.service';
import { User } from '../../users/entities/user.entity';
export interface PricingPlan {
    id: string;
    name: string;
    displayName: string;
    description: string;
    features: string[];
    priceMonthly: number;
    priceYearly: number;
    stripePriceMonthlyId: string;
    stripePriceYearlyId: string;
    stripeProductId: string;
    limits: {
        trades: number | 'unlimited';
        accounts: number | 'unlimited';
        marketData: boolean;
        analytics: 'basic' | 'advanced' | 'premium';
    };
}
export interface BillingInfo {
    currentPlan: string;
    status: string;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    usage: SubscriptionUsage;
}
export interface SubscriptionUsage {
    trades: number;
    accounts: number;
    periodStart: Date;
    periodEnd: Date;
}
export declare class SubscriptionService {
    private subscriptionRepository;
    private userRepository;
    private configService;
    private stripeService;
    private readonly logger;
    private readonly pricingPlans;
    constructor(subscriptionRepository: Repository<Subscription>, userRepository: Repository<User>, configService: ConfigService, stripeService: StripeService);
    getPricingPlans(): PricingPlan[];
    getPricingPlan(planId: string): PricingPlan | null;
    getOrCreateSubscription(userId: string): Promise<Subscription>;
    getCurrentSubscription(userId: string): Promise<BillingInfo>;
    getCurrentUsage(userId: string): SubscriptionUsage;
    createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string): Promise<{
        sessionId: string;
        url: string;
    }>;
    createPortalSession(userId: string, returnUrl: string): Promise<{
        url: string;
    }>;
    handleWebhookEvent(event: Stripe.Event): Promise<void>;
    private handleSubscriptionUpdate;
    private handleSubscriptionCancellation;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private getPlanFromPriceId;
    hasFeatureAccess(userId: string, feature: string): Promise<boolean>;
    checkUsageLimit(userId: string, feature: 'trades' | 'accounts'): Promise<boolean>;
    incrementUsage(userId: string, feature: 'AI_NOTES' | 'TRADES' | 'STRATEGIES'): Promise<void>;
    createPaymentLink(userId: string, priceId: string): Promise<{
        paymentLinkId: string;
        url: string;
    }>;
}
