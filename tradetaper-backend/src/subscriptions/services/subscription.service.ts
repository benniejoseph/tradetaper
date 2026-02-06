import { Injectable, Logger, HttpException, HttpStatus, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { StripeService } from './stripe.service';
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
  stripePriceMonthlyId: string;
  stripePriceYearlyId: string;
  stripeProductId: string;
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
    private stripeService: StripeService,
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
        stripePriceMonthlyId: '',
        stripePriceYearlyId: '',
        stripeProductId: '',
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
        stripePriceMonthlyId: this.configService.get<string>('STRIPE_PRICE_ESSENTIAL_MONTHLY') || '',
        stripePriceYearlyId: this.configService.get<string>('STRIPE_PRICE_ESSENTIAL_YEARLY') || '',
        stripeProductId: this.configService.get<string>('STRIPE_PRODUCT_ESSENTIAL') || '',
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
        stripePriceMonthlyId: this.configService.get<string>('STRIPE_PRICE_PREMIUM_MONTHLY') || '',
        stripePriceYearlyId: this.configService.get<string>('STRIPE_PRICE_PREMIUM_YEARLY') || '',
        stripeProductId: this.configService.get<string>('STRIPE_PRODUCT_PREMIUM') || '',
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

  // Create Stripe checkout session
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    try {
      this.logger.log(
        `🔍 Creating checkout session for user ${userId}, price: ${priceId}`,
      );

      // Get user subscription to get customer ID or create new customer
      const subscription = await this.getOrCreateSubscription(userId);
      this.logger.log(`✅ Retrieved subscription for user ${userId}`);

      let customerId = subscription.stripeCustomerId;

      if (!customerId) {
        this.logger.log(`🆕 Creating new Stripe customer for user ${userId}`);
        try {
          // get user email from user id
          const user = await this.userRepository.findOne({
            where: { id: userId },
          });
          if (!user) {
            throw new Error(`User not found for id ${userId}`);
          }
          const name =
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : undefined;
          // Create Stripe customer
          const customer = await this.stripeService.createCustomer(
            user.email,
            name,
          );
          customerId = customer.id;
          this.logger.log(`✅ Created Stripe customer: ${customerId}`);

          // Update subscription with customer ID
          subscription.stripeCustomerId = customerId;
          await this.subscriptionRepository.save(subscription);
          this.logger.log(`✅ Updated subscription with customer ID`);
        } catch (customerError) {
          this.logger.error(`❌ Failed to create Stripe customer:`, {
            error: customerError.message,
            code: customerError.code,
            type: customerError.type,
            userId,
          });
          throw customerError;
        }
      } else {
        this.logger.log(`✅ Using existing Stripe customer: ${customerId}`);
      }

      this.logger.log(`🛒 Creating Stripe checkout session...`);

      const session = await this.stripeService.createCheckoutSession(
        priceId,
        customerId,
        successUrl,
        cancelUrl,
        userId,
      );

      this.logger.log(`✅ Checkout session created: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (error) {
      this.logger.error(`❌ Stripe checkout session creation failed:`, {
        error: error.message,
        code: error.code,
        type: error.type,
        requestId: error.requestId,
        statusCode: error.statusCode,
        userId,
        priceId,
        stack: error.stack,
      });

      throw new HttpException(
        `Failed to create checkout session: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Create Stripe customer portal session
  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    try {
      const subscription = await this.getOrCreateSubscription(userId);

      if (!subscription.stripeCustomerId) {
        throw new HttpException(
          'No active subscription found',
          HttpStatus.NOT_FOUND,
        );
      }

      const session = await this.stripeService.createBillingPortalSession(
        subscription.stripeCustomerId,
        returnUrl,
      );

      return { url: session.url };
    } catch (error) {
      this.logger.error('Failed to create portal session:', error);
      throw new HttpException(
        'Failed to create portal session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Handle Stripe webhook events
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          this.handlePaymentFailed(event.data.object);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing webhook event ${event.type}:`, error);
      throw error;
    }
  }

  private async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = stripeSubscription.metadata?.userId;

    if (!userId) {
      this.logger.warn('No userId found in subscription metadata');
      return;
    }

    const subscription = await this.getOrCreateSubscription(userId);

    // Determine plan from price ID
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    const plan = this.getPlanFromPriceId(priceId);

    subscription.stripeSubscriptionId = stripeSubscription.id;
    subscription.stripeCustomerId = stripeSubscription.customer as string;
    subscription.plan = plan;
    subscription.status = stripeSubscription.status as SubscriptionStatus;
    subscription.currentPeriodStart = new Date(
      (stripeSubscription as any).current_period_start * 1000,
    );
    subscription.currentPeriodEnd = new Date(
      (stripeSubscription as any).current_period_end * 1000,
    );
    subscription.cancelAtPeriodEnd = (
      stripeSubscription as any
    ).cancel_at_period_end;

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Updated subscription for user ${userId}: ${plan}`);
  }

  private async handleSubscriptionCancellation(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const userId = stripeSubscription.metadata?.userId;

    if (!userId) {
      this.logger.warn('No userId found in subscription metadata');
      return;
    }

    const subscription = await this.getOrCreateSubscription(userId);
    subscription.status = SubscriptionStatus.CANCELED;
    subscription.plan = 'free';
    subscription.cancelAtPeriodEnd = false;

    await this.subscriptionRepository.save(subscription);
    this.logger.log(`Canceled subscription for user ${userId}`);
  }

  private handlePaymentSucceeded(invoice: Stripe.Invoice): void {
    this.logger.log(`Payment succeeded for invoice ${invoice.id}`);
    // Additional logic for successful payments if needed
  }

  private handlePaymentFailed(invoice: Stripe.Invoice): void {
    this.logger.log(`Payment failed for invoice ${invoice.id}`);
    // Additional logic for failed payments if needed
  }

  private getPlanFromPriceId(priceId: string): string {
    for (const plan of this.pricingPlans) {
      if (
        plan.stripePriceMonthlyId === priceId ||
        plan.stripePriceYearlyId === priceId
      ) {
        return plan.name;
      }
    }
    return 'free';
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
      // This part of the logic needs to be adapted to TypeORM or a different usage tracking mechanism
      // For now, it's a placeholder to avoid breaking the existing structure
      this.logger.log(
        `Incrementing usage for user ${userId}, feature: ${feature}`,
      );
      // Example: If you had a usage entity, you'd update it here
      // await this.prisma.usage.update({
      //   where: {
      //     id: subscription.usage.id,
      //   },
      //   data: {
      //     [feature]: {
      //       increment: 1,
      //     },
      //   },
      // });
    }
  }

  // Create Stripe payment link (alternative to checkout sessions)
  async createPaymentLink(
    userId: string,
    priceId: string,
  ): Promise<{ paymentLinkId: string; url: string }> {
    try {
      this.logger.log(
        `🔗 Creating payment link for user ${userId}, price: ${priceId}`,
      );

      // Get or create subscription to ensure customer exists
      const subscription = await this.getOrCreateSubscription(userId);

      let customerId = subscription.stripeCustomerId;

      if (!customerId) {
        this.logger.log(`🆕 Creating new Stripe customer for payment link`);
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        if (!user) {
          throw new Error(`User not found for id ${userId}`);
        }
        const name =
          user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : undefined;
        const customer = await this.stripeService.createCustomer(
          user.email,
          name,
        );
        customerId = customer.id;

        subscription.stripeCustomerId = customerId;
        await this.subscriptionRepository.save(subscription);
        this.logger.log(`✅ Created customer for payment link: ${customerId}`);
      }

      // Create payment link
      const paymentLink = await this.stripeService.createPaymentLink(
        userId,
        priceId,
        customerId,
      );

      this.logger.log(`✅ Payment link created: ${paymentLink.paymentLinkId}`);

      return {
        paymentLinkId: paymentLink.paymentLinkId,
        url: paymentLink.url,
      };
    } catch (error) {
      this.logger.error(`❌ Payment link creation failed:`, {
        error: error.message,
        code: error.code,
        type: error.type,
        userId,
        priceId,
      });

      throw new HttpException(
        `Failed to create payment link: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
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
