import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import {
  Subscription,
  SubscriptionStatus,
  SubscriptionTier,
} from '../entities/subscription.entity';
// import { Usage } from '../entities/usage.entity';
import { User } from '../../users/entities/user.entity';
import { Trade } from '../../trades/entities/trade.entity';
import { Account } from '../../users/entities/account.entity';
import { MT5Account } from '../../users/entities/mt5-account.entity';
import { Note } from '../../notes/entities/note.entity';
import { Strategy } from '../../strategies/entities/strategy.entity';
import { RazorpayService } from './razorpay.service';
import { Between } from 'typeorm';

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
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(MT5Account)
    private mt5AccountRepository: Repository<MT5Account>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    @InjectRepository(Strategy)
    private strategyRepository: Repository<Strategy>,
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
          'No Reports',
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
          aiAnalysis: false,
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
          'No Reports',
        ],
        priceMonthly: 1999, // Example price $19.99
        priceYearly: 19999,
        razorpayPlanMonthlyId:
          this.configService.get<string>('RAZORPAY_PLAN_ESSENTIAL_MONTHLY') ||
          '',
        razorpayPlanYearlyId:
          this.configService.get<string>('RAZORPAY_PLAN_ESSENTIAL_YEARLY') ||
          '',
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
          aiAnalysis: false,
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
          'Weekly & Monthly Reports',
        ],
        priceMonthly: 4999, // Example price $49.99
        priceYearly: 49999,
        razorpayPlanMonthlyId:
          this.configService.get<string>('RAZORPAY_PLAN_PREMIUM_MONTHLY') || '',
        razorpayPlanYearlyId:
          this.configService.get<string>('RAZORPAY_PLAN_PREMIUM_YEARLY') || '',
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
          aiAnalysis: true,
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

  // Force update subscription plan (Admin/System override)
  async forceUpdateSubscriptionPlan(
    userId: string,
    planId: string,
  ): Promise<Subscription> {
    const subscription = await this.getOrCreateSubscription(userId);

    // Validate plan exists
    const plan = this.getPricingPlan(planId);
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    if (subscription.plan !== planId) {
      subscription.plan = planId;
      // Reset limits or handle expiration if needed, but for now just switching plan
      // You might want to update billing details here too if integrated deeply
      await this.subscriptionRepository.save(subscription);
      this.logger.log(
        `Forced subscription update for user ${userId} to ${planId}`,
      );
    }
    return subscription;
  }

  async upgradeUserByEmail(
    email: string,
    planId: string,
  ): Promise<Subscription> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return this.forceUpdateSubscriptionPlan(user.id, planId);
  }

  // Get current subscription with billing info
  async getCurrentSubscription(userId: string): Promise<BillingInfo> {
    const subscription = await this.getOrCreateSubscription(userId);
    // getCurrentUsage is now async
    const usage = await this.getCurrentUsage(userId);

    return {
      currentPlan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      usage,
    };
  }

  // Get current usage for user
  // Get current usage for user
  async getCurrentUsage(userId: string): Promise<SubscriptionUsage> {
    if (!userId) {
      throw new Error('User ID is required to get usage');
    }

    // Get current subscription to determine period
    const subscription = await this.getOrCreateSubscription(userId);
    const now = new Date();

    // Fallback if subscription period is invalid
    const periodStart =
      subscription.currentPeriodStart ||
      new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd =
      subscription.currentPeriodEnd ||
      new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Count Trades in current period
    const tradesCount = await this.tradeRepository.count({
      where: {
        userId,
        openTime: Between(periodStart, periodEnd),
      },
    });

    // 2. Count Active Manual Accounts (Total)
    const manualAccountsCount = await this.accountRepository.count({
      where: {
        userId,
        isActive: true,
      },
    });

    // 3. Count Active MT5 Accounts (Total)
    const mt5AccountsCount = await this.mt5AccountRepository.count({
      where: {
        userId,
        isActive: true,
      },
    });

    // 4. Count Notes (Total)
    const notesCount = await this.noteRepository.count({
      where: {
        userId,
        // deletedAt is handled by TypeORM automatic soft-delete check if @DeleteDateColumn is used
      },
    });

    // 5. Count Strategies (Total) - not in SubscriptionUsage interface yet but good to have
    // const strategiesCount = await this.strategyRepository.count({ where: { userId } });

    return {
      trades: tradesCount,
      manualAccounts: manualAccountsCount,
      mt5Accounts: mt5AccountsCount,
      notes: notesCount,
      periodStart,
      periodEnd,
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
    feature:
      | 'trades'
      | 'accounts'
      | 'mt5Accounts'
      | 'manualAccounts'
      | 'notes'
      | 'strategies',
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
    this.logger.log(
      `Creating Razorpay subscription for user ${userId}, plan: ${planId}, period: ${period}`,
    );

    // 1. Get Plan Details
    const planConfig = this.getPricingPlan(planId);
    if (!planConfig) throw new BadRequestException('Invalid plan ID');

    const razorpayPlanId =
      period === 'monthly'
        ? planConfig.razorpayPlanMonthlyId
        : planConfig.razorpayPlanYearlyId;
    if (!razorpayPlanId)
      throw new BadRequestException(
        'Razorpay plan not configured for this tier',
      );

    // 2. Get User & Subscription
    const subscription = await this.getOrCreateSubscription(userId);
    let customerId = subscription.razorpayCustomerId;

    // 3. Create Customer if needed
    if (!customerId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      try {
        const customer = await this.razorpayService.createCustomer(
          user.email,
          user.firstName ? `${user.firstName} ${user.lastName}` : user.email,
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

  // Handle Razorpay Webhooks
  async handleRazorpayWebhook(event: any) {
    const { event: eventType, payload } = event;
    const subscriptionEntity = payload.subscription
      ? payload.subscription.entity
      : null;
    const paymentEntity = payload.payment ? payload.payment.entity : null;

    this.logger.log(`Received Webhook: ${eventType}`);

    if (!subscriptionEntity && !paymentEntity) {
      this.logger.warn(
        'Webhook payload missing subscription or payment entity',
      );
      return;
    }

    const razorpaySubscriptionId = subscriptionEntity
      ? subscriptionEntity.id
      : null;

    // Find subscription by Razorpay ID (if exists)
    let subscription: Subscription | null = null;
    if (razorpaySubscriptionId) {
      subscription = await this.subscriptionRepository.findOne({
        where: { razorpaySubscriptionId: razorpaySubscriptionId },
      });
    }

    // Attempt to match by customer email if subscription ID not found (fallback)
    if (!subscription && paymentEntity && paymentEntity.email) {
      // Using custom query to join user
      subscription = await this.subscriptionRepository
        .createQueryBuilder('sub')
        .leftJoinAndSelect('sub.user', 'user')
        .where('user.email = :email', { email: paymentEntity.email })
        .getOne();
    }

    if (!subscription) {
      this.logger.error(
        `Subscription not found for webhook event: ${eventType}`,
      );
      // Optionally create one, but usually we expect it to exist from 'createSubscription' step
      return;
    }

    switch (eventType) {
      case 'subscription.authenticated':
        this.logger.log(
          `Subscription authenticated for user ${subscription.userId}`,
        );
        subscription.status = SubscriptionStatus.ACTIVE;
        // Activate plan logic
        await this.updateSubscriptionFromRazorpay(
          subscription,
          subscriptionEntity,
        );
        break;

      case 'subscription.charged':
        this.logger.log(`Subscription charged for user ${subscription.userId}`);
        subscription.status = SubscriptionStatus.ACTIVE;
        await this.updateSubscriptionFromRazorpay(
          subscription,
          subscriptionEntity,
        );
        break;

      case 'subscription.cancelled':
        this.logger.log(
          `Subscription cancelled for user ${subscription.userId}`,
        );
        subscription.cancelAtPeriodEnd = true;
        // logic to set end date?
        if (subscriptionEntity.end_at) {
          subscription.currentPeriodEnd = new Date(
            subscriptionEntity.end_at * 1000,
          );
        }
        break;

      case 'payment.captured':
        // Sometimes happens before subscription logic
        this.logger.log(`Payment captured for user ${subscription.userId}`);
        break;

      case 'payment.failed':
        this.logger.warn(`Payment failed for user ${subscription.userId}`);
        // Notify user?
        break;
    }

    await this.subscriptionRepository.save(subscription);
  }

  private async updateSubscriptionFromRazorpay(
    subscription: Subscription,
    entity: any,
  ) {
    if (!entity) return;

    // Update config
    if (entity.plan_id) {
      // Map Razorpay Plan ID back to internal Plan ID
      const plan = this.pricingPlans.find(
        (p) =>
          p.razorpayPlanMonthlyId === entity.plan_id ||
          p.razorpayPlanYearlyId === entity.plan_id,
      );

      if (plan) {
        subscription.plan = plan.id;

        // Set tier
        if (plan.id === 'premium') subscription.tier = SubscriptionTier.PREMIUM;
        else if (plan.id === 'essential')
          subscription.tier = SubscriptionTier.ESSENTIAL;
        else subscription.tier = SubscriptionTier.FREE;

        // Set Interval
        subscription.interval = ((p) =>
          p.razorpayPlanYearlyId === entity.plan_id ? 'year' : 'month')(plan);
      }
    }

    // Update Dates
    if (entity.current_start) {
      subscription.currentPeriodStart = new Date(entity.current_start * 1000);
    }
    if (entity.current_end) {
      subscription.currentPeriodEnd = new Date(entity.current_end * 1000);
    }

    // Other fields
    subscription.razorpaySubscriptionId = entity.id;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelAtPeriodEnd = false; // Reset cancellation if renewed
  }
}
