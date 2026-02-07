import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription } from '../entities/subscription.entity';
import { User } from '../../users/entities/user.entity';
import { Trade } from '../../trades/entities/trade.entity';
import { Account } from '../../users/entities/account.entity';
import { MT5Account } from '../../users/entities/mt5-account.entity';
import { Note } from '../../notes/entities/note.entity';
import { Strategy } from '../../strategies/entities/strategy.entity';
import { RazorpayService } from './razorpay.service';
import { CouponsService } from '../../coupons/services/coupons.service';
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
    private tradeRepository;
    private accountRepository;
    private mt5AccountRepository;
    private noteRepository;
    private strategyRepository;
    private configService;
    private razorpayService;
    private couponsService;
    private readonly logger;
    private readonly pricingPlans;
    constructor(subscriptionRepository: Repository<Subscription>, userRepository: Repository<User>, tradeRepository: Repository<Trade>, accountRepository: Repository<Account>, mt5AccountRepository: Repository<MT5Account>, noteRepository: Repository<Note>, strategyRepository: Repository<Strategy>, configService: ConfigService, razorpayService: RazorpayService, couponsService: CouponsService);
    getPricingPlans(): PricingPlan[];
    getPricingPlan(planId: string): PricingPlan | null;
    getOrCreateSubscription(userId: string): Promise<Subscription>;
    forceUpdateSubscriptionPlan(userId: string, planId: string): Promise<Subscription>;
    upgradeUserByEmail(email: string, planId: string): Promise<Subscription>;
    getCurrentSubscription(userId: string): Promise<BillingInfo>;
    getCurrentUsage(userId: string): Promise<SubscriptionUsage>;
    hasFeatureAccess(userId: string, feature: string): Promise<boolean>;
    checkUsageLimit(userId: string, feature: 'trades' | 'accounts' | 'mt5Accounts' | 'manualAccounts' | 'notes' | 'strategies'): Promise<boolean>;
    incrementUsage(userId: string, feature: 'AI_NOTES' | 'TRADES' | 'STRATEGIES'): Promise<void>;
    createRazorpaySubscription(userId: string, planId: string, period: 'monthly' | 'yearly', couponCode?: string): Promise<{
        subscriptionId: any;
        key: string | undefined;
        currency: string;
        name: string;
        description: string;
        customer_id: string;
        offer_id: string | undefined;
    }>;
    handleRazorpayWebhook(event: any): Promise<void>;
    private updateSubscriptionFromRazorpay;
}
