import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { RazorpayService } from './razorpay.service';
export interface PricingPlan {
    id: string;
    name: string;
    displayName: string;
    description: string;
    features: string[];
    priceMonthly: number;
    priceYearly: number;
    razorpayPlanMonthlyId: string;
    razorpayPlanYearlyId: string;
    limits: {
        manualAccounts: number | 'unlimited';
        mt5Accounts: number | 'unlimited';
        trades: number | 'unlimited';
        strategies: number | 'unlimited';
        notes: number | 'unlimited';
        storage: string;
        marketIntelligence: 'basic' | 'full';
        discipline: boolean;
        backtesting: 'restricted' | 'full';
        psychology: boolean;
        reports: boolean;
        aiAnalysis: boolean;
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
    manualAccounts: number;
    mt5Accounts: number;
    notes: number;
    periodStart: Date;
    periodEnd: Date;
}
export declare class SubscriptionService {
    private subscriptionRepository;
    private userRepository;
    private configService;
    private razorpayService;
    private readonly logger;
    private readonly pricingPlans;
    constructor(subscriptionRepository: Repository<Subscription>, userRepository: Repository<User>, configService: ConfigService, razorpayService: RazorpayService);
    getPricingPlans(): PricingPlan[];
    getPricingPlan(planId: string): PricingPlan | null;
    getOrCreateSubscription(userId: string): Promise<Subscription>;
    getCurrentSubscription(userId: string): Promise<BillingInfo>;
    getCurrentUsage(userId: string): SubscriptionUsage;
    hasFeatureAccess(userId: string, feature: string): Promise<boolean>;
    checkUsageLimit(userId: string, feature: 'trades' | 'accounts' | 'mt5Accounts' | 'manualAccounts' | 'notes'): Promise<boolean>;
    incrementUsage(userId: string, feature: 'AI_NOTES' | 'TRADES' | 'STRATEGIES'): Promise<void>;
    createRazorpaySubscription(userId: string, planId: string, period: 'monthly' | 'yearly'): Promise<{
        subscriptionId: any;
        key: string | undefined;
        currency: string;
        name: string;
        description: string;
        customer_id: string;
    }>;
}
