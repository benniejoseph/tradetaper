import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
// import { Usage } from '../entities/usage.entity';

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

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly stripe: Stripe;
  private readonly pricingPlans: PricingPlan[];

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-06-30.basil',
    });

    // Initialize pricing plans with environment variables
    this.pricingPlans = [
      {
        id: 'starter',
        name: 'starter',
        displayName: 'TradeTaper Starter',
        description: 'Essential trading journal for beginners',
        features: [
          'Up to 100 trades per month',
          '3 trading accounts',
          'Basic analytics',
          'Trade performance tracking',
          'Email support',
        ],
        priceMonthly: 999, // $9.99
        priceYearly: 9999, // $99.99
        stripePriceMonthlyId:
          this.configService.get<string>('STRIPE_PRICE_STARTER_MONTHLY') || '',
        stripePriceYearlyId:
          this.configService.get<string>('STRIPE_PRICE_STARTER_YEARLY') || '',
        stripeProductId:
          this.configService.get<string>('STRIPE_PRODUCT_STARTER') || '',
        limits: {
          trades: 100,
          accounts: 3,
          marketData: false,
          analytics: 'basic',
        },
      },
      {
        id: 'professional',
        name: 'professional',
        displayName: 'TradeTaper Professional',
        description: 'Advanced trading journal for serious traders',
        features: [
          'Unlimited trades',
          'Unlimited trading accounts',
          'Advanced analytics & metrics',
          'Real-time market data',
          'ICT concepts tracking',
          'Export capabilities',
          'Priority support',
        ],
        priceMonthly: 2999, // $29.99
        priceYearly: 29999, // $299.99
        stripePriceMonthlyId:
          this.configService.get<string>('STRIPE_PRICE_PROFESSIONAL_MONTHLY') ||
          '',
        stripePriceYearlyId:
          this.configService.get<string>('STRIPE_PRICE_PROFESSIONAL_YEARLY') ||
          '',
        stripeProductId:
          this.configService.get<string>('STRIPE_PRODUCT_PROFESSIONAL') || '',
        limits: {
          trades: 'unlimited',
          accounts: 'unlimited',
          marketData: true,
          analytics: 'advanced',
        },
      },
      {
        id: 'enterprise',
        name: 'enterprise',
        displayName: 'TradeTaper Enterprise',
        description:
          'Premium solution for professional traders and institutions',
        features: [
          'Everything in Professional',
          'White-label options',
          'API access',
          'Custom integrations',
          'Dedicated account manager',
          'SLA guarantees',
          '24/7 priority support',
        ],
        priceMonthly: 9999, // $99.99
        priceYearly: 99999, // $999.99
        stripePriceMonthlyId:
          this.configService.get<string>('STRIPE_PRICE_ENTERPRISE_MONTHLY') ||
          '',
        stripePriceYearlyId:
          this.configService.get<string>('STRIPE_PRICE_ENTERPRISE_YEARLY') ||
          '',
        stripeProductId:
          this.configService.get<string>('STRIPE_PRODUCT_ENTERPRISE') || '',
        limits: {
          trades: 'unlimited',
          accounts: 'unlimited',
          marketData: true,
          analytics: 'premium',
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
  async getCurrentUsage(userId: string): Promise<SubscriptionUsage> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Return default usage during migration
    return {
      trades: 0,
      accounts: 0,
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
          // Create Stripe customer
          const customer = await this.stripe.customers.create({
            metadata: { userId },
          });
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
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
          userId,
        },
      };

      this.logger.log(
        `📋 Session params:`,
        JSON.stringify(sessionParams, null, 2),
      );

      const session = await this.stripe.checkout.sessions.create(sessionParams);

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

      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      });

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
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
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

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Payment succeeded for invoice ${invoice.id}`);
    // Additional logic for successful payments if needed
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
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
      case 'market_data':
        return plan.limits.marketData;
      case 'unlimited_trades':
        return plan.limits.trades === 'unlimited';
      case 'advanced_analytics':
        return (
          plan.limits.analytics === 'advanced' ||
          plan.limits.analytics === 'premium'
        );
      case 'premium_analytics':
        return plan.limits.analytics === 'premium';
      default:
        return false;
    }
  }

  // Check if user can perform an action based on usage limits
  async checkUsageLimit(
    userId: string,
    feature: 'trades' | 'accounts',
  ): Promise<boolean> {
    const subscription = await this.getOrCreateSubscription(userId);
    const plan = this.getPricingPlan(subscription.plan);

    if (!plan) return false;

    // Check if the plan has unlimited access for this feature
    if (feature === 'trades' && plan.limits.trades === 'unlimited') {
      return true;
    }

    if (feature === 'accounts' && plan.limits.accounts === 'unlimited') {
      return true;
    }

    // For now, return true during development/migration phase
    // TODO: Implement proper usage tracking once usage_tracking table is stable
    const usage = await this.getCurrentUsage(userId);

    if (feature === 'trades') {
      const limit =
        typeof plan.limits.trades === 'number' ? plan.limits.trades : Infinity;
      return usage.trades < limit;
    }

    if (feature === 'accounts') {
      const limit =
        typeof plan.limits.accounts === 'number'
          ? plan.limits.accounts
          : Infinity;
      return usage.accounts < limit;
    }

    return true;
  }

  // Increment usage counter (simplified for now)
  async incrementUsage(
    userId: string,
    type: 'trades' | 'accounts',
  ): Promise<void> {
    // TODO: Implement usage tracking after usage_tracking table is stable
    this.logger.log(`Usage increment for user ${userId}, type: ${type}`);
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
        const customer = await this.stripe.customers.create({
          metadata: { userId },
        });
        customerId = customer.id;

        subscription.stripeCustomerId = customerId;
        await this.subscriptionRepository.save(subscription);
        this.logger.log(`✅ Created customer for payment link: ${customerId}`);
      }

      // Create payment link
      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId,
          customerId,
        },
      });

      this.logger.log(`✅ Payment link created: ${paymentLink.id}`);

      return {
        paymentLinkId: paymentLink.id,
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
}
