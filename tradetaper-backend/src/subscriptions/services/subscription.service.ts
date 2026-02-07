import { Injectable, Logger, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
// import { Usage } from '../entities/usage.entity';
import { User } from '../../users/entities/user.entity';
import { RazorpayService } from './razorpay.service';

export interface PricingPlan {
  id: string; // 'free' | 'essential' | 'premium'
  name: string;
  displayName: string;
  description: string;
  features: string[]; // List of features to display
  priceMonthly: number;
  priceYearly: number;

  razorpayPlanMonthlyId: string; // Added fields
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
    psychology: boolean; // false = restricted
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

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly pricingPlans: PricingPlan[];

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService,
    private razorpayService: RazorpayService,
  ) {
    // Initialize pricing plans
    this.pricingPlans = [
      {
        id: 'free',
        name: 'free',
        displayName: 'Free',
        description: 'Get started with basic journaling.',
        features: [
          '1 Manual Account',
          '50 Trade Records',
          '3 Strategies',
          'Minimum Storage',
          'Economic Chart & News Hub',
          'Restriction on Discipline Page',
          'Restriction on Notes Page',
          'Restriction on Backtesting',
          'Restriction on Psychology',
          'No MetaTrader Connect',
          'No Live Chart & AI Analysis',
          'No Reports'
        ],
        priceMonthly: 0,
        priceYearly: 0,

        razorpayPlanMonthlyId: '',
        razorpayPlanYearlyId: '',
        limits: {
          manualAccounts: 1,
          mt5Accounts: 0,
          trades: 50,
          strategies: 3,
          notes: 0, 
          storage: 'Minimum',
          marketIntelligence: 'basic',
          discipline: false,
          backtesting: 'restricted',
          psychology: false,
          reports: false,
          aiAnalysis: false
        },
      },
      {
        id: 'essential',
        name: 'essential',
        displayName: 'Essential',
        description: 'Perfect for growing traders.',
        features: [
          '3 Manual Accounts',
          'Connect 2 MetaTrader Accounts',
          '500 Trade Records',
          '7 Strategies',
          '1GB Storage',
          'Economic Chart & News Hub',
          'Access to Discipline Page',
          '50 Notes',
          'Restriction on Pattern Discovery',
          'Restriction on Psychology',
          'No Live Chart & AI Analysis',
          'No Reports'
        ],
        priceMonthly: 1999, // Example price $19.99
        priceYearly: 19999,
        razorpayPlanMonthlyId: this.configService.get<string>('RAZORPAY_PLAN_ESSENTIAL_MONTHLY') || '',
        razorpayPlanYearlyId: this.configService.get<string>('RAZORPAY_PLAN_ESSENTIAL_YEARLY') || '',
        limits: {
          manualAccounts: 3,
          mt5Accounts: 2,
          trades: 500,
          strategies: 7,
          notes: 50,
          storage: '1GB',
          marketIntelligence: 'basic',
          discipline: true,
          backtesting: 'restricted', // Pattern discovery restricted
          psychology: false,
          reports: false,
          aiAnalysis: false
        },
      },
      {
        id: 'premium',
        name: 'premium',
        displayName: 'Premium',
        description: 'Unlimited access for pros.',
        features: [
          'Unlimited Manual Accounts',
          'Unlimited MetaTrader Accounts',
          'Unlimited Trade Records',
          'Unlimited Strategies',
          'Unlimited Notes',
          '5GB Storage',
          'Full Market Intelligence',
          'Full Discipline Access',
          'Full Backtesting Access',
          'AI Psychology Insights',
          'Weekly & Monthly Reports'
        ],
        priceMonthly: 4999, // Example price $49.99
        priceYearly: 49999,
        razorpayPlanMonthlyId: this.configService.get<string>('RAZORPAY_PLAN_PREMIUM_MONTHLY') || '',
        razorpayPlanYearlyId: this.configService.get<string>('RAZORPAY_PLAN_PREMIUM_YEARLY') || '',
        limits: {
          manualAccounts: 'unlimited',
          mt5Accounts: 'unlimited',
          trades: 'unlimited',
          strategies: 'unlimited',
          notes: 'unlimited',
          storage: '5GB',
          marketIntelligence: 'full',
          discipline: true,
          backtesting: 'full',
          psychology: true,
          reports: true,
          aiAnalysis: true
        },
      },
    ];
  }

  // Get all available pricing plans
  getPricingPlans(): PricingPlan[] {
    return this.pricingPlans;
  }

  // Get a specific pricing plan by ID
  getPricingPlan(planId: string): PricingPlan | null {
    return (
      this.pricingPlans.find(
        (plan) => plan.id === planId || plan.name === planId,
      ) || null
    );
  }

  // Get or create subscription for user
  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      // Create free subscription
      subscription = this.subscriptionRepository.create({
        userId,
        plan: 'free',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
      subscription = await this.subscriptionRepository.save(subscription);
      this.logger.log(`Created free subscription for user ${userId}`);
    }

    return subscription;
  }

  // Get current subscription with billing info
  async getCurrentSubscription(userId: string): Promise<BillingInfo> {
    const subscription = await this.getOrCreateSubscription(userId);
    const usage = this.getCurrentUsage(userId);

    return {
      currentPlan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      usage,
    };
  }

  // Get current usage for user
  getCurrentUsage(userId: string): SubscriptionUsage {
    if (!userId) {
      throw new Error('User ID is required to get usage');
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Return default usage during migration
    return {
      trades: 0,
      manualAccounts: 0,
      mt5Accounts: 0,
      notes: 0,
      periodStart: startOfMonth,
      periodEnd: endOfMonth,
    };
  }

  // Check if user has access to a feature
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = this.getPricingPlan(subscription.plan);

    if (!plan) return false;

    switch (feature) {
      case 'discipline':
        return plan.limits.discipline;
      // case 'market_intelligence_full': // If you want to check full access
      //   return plan.limits.marketIntelligence === 'full';
      // Mapped to existing checks or new ones?
      // Let's implement generic Limit checker or specific existing ones
      case 'market_data': 
         // Old feature key, map to new logic? 
         // Essential/Premium have it (Economic Chart). Free has it too.
         // 'Live Chart' is restricted on Free/Essential.
         // Let's assume 'market_data' means basic access which they all have.
         return true; 
      
      case 'unlimited_trades':
        return plan.limits.trades === 'unlimited';
      
      case 'advanced_analytics': 
        // Map to aiAnalysis?
        return plan.limits.aiAnalysis; // Only Premium has AI Analysis

      // New Features
      case 'psychology':
        return plan.limits.psychology;
      case 'reports':
        return plan.limits.reports;
      
      default:
        return false;
    }
  }

  async checkUsageLimit(
    userId: string,
    feature: 'trades' | 'accounts' | 'mt5Accounts' | 'manualAccounts' | 'notes',
  ): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(userId);
    const plan = this.getPricingPlan(subscription.currentPlan);

    if (!plan) {
      // No plan found, deny access
      return false;
    }

    // Map 'accounts' to 'manualAccounts' for backward compatibility
    const limitKey = feature === 'accounts' ? 'manualAccounts' : feature;
    const limit = plan.limits[limitKey];

    if (limit === 'unlimited') {
      return true;
    }

    // Map usage key similarly
    const usageKey = feature === 'accounts' ? 'manualAccounts' : feature;
    const usage = subscription.usage[usageKey];
    
    // Safety check if usage is defined
    if (typeof usage === 'undefined') return true;

    return usage < limit;
  }

  async incrementUsage(
    userId: string,
    feature: 'AI_NOTES' | 'TRADES' | 'STRATEGIES',
  ): Promise<void> {
    if (!userId || !feature) {
      return;
    }

    const user = await this.subscriptionRepository.findOne({
      where: {
        userId: userId,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const subscription = await this.getCurrentSubscription(userId);

    if (!subscription) {
      return;
    }

    if (subscription.currentPlan === 'free') {
       // Placeholder for usage increment logic
       this.logger.log(
        `Incrementing usage for user ${userId}, feature: ${feature}`,
      );
    }
  }

  // Create Razorpay Subscription
  async createRazorpaySubscription(
    userId: string,
    planId: string, // 'starter', 'professional', etc.
    period: 'monthly' | 'yearly',
  ) {
    this.logger.log(`Creating Razorpay subscription for user ${userId}, plan: ${planId}, period: ${period}`);
    
    // 1. Get Plan Details
    const planConfig = this.getPricingPlan(planId);
    if (!planConfig) throw new BadRequestException('Invalid plan ID');
    
    const razorpayPlanId = period === 'monthly' ? planConfig.razorpayPlanMonthlyId : planConfig.razorpayPlanYearlyId;
    if (!razorpayPlanId) throw new BadRequestException('Razorpay plan not configured for this tier');

    // 2. Get User & Subscription
    const subscription = await this.getOrCreateSubscription(userId);
    let customerId = subscription.razorpayCustomerId;

    // 3. Create Customer if needed
    if (!customerId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if(!user) throw new NotFoundException('User not found');
        
        try {
            const customer = await this.razorpayService.createCustomer(
                user.email, 
                user.firstName ? `${user.firstName} ${user.lastName}` : user.email
            );
            customerId = customer.id;
            subscription.razorpayCustomerId = customerId;
            await this.subscriptionRepository.save(subscription);
        } catch (e) {
            this.logger.error('Failed to create Razorpay customer', e);
            throw new InternalServerErrorException('Payment initialization failed');
        }
    }

    // 4. Create Subscription
    try {
        const sub = await this.razorpayService.createSubscription(razorpayPlanId);
        
        // Save sub ID
        subscription.razorpaySubscriptionId = sub.id;
        // logic to handle pending status? Razorpay subs are 'created' until authorized.
        await this.subscriptionRepository.save(subscription);

        return {
            subscriptionId: sub.id,
            key: this.configService.get<string>('RAZORPAY_KEY_ID'),
            currency: 'INR', // Default for Indian Bus.
            name: 'TradeTaper',
            description: `${planConfig.displayName} (${period})`,
            customer_id: customerId, // Useful for prefill
        };
    } catch (e) {
        this.logger.error('Failed to create Razorpay subscription', e);
        throw new InternalServerErrorException('Failed to initiate subscription');
    }
  }
}
