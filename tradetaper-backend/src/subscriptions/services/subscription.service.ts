import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionTier } from '../entities/subscription.entity';
import { UsageTracking } from '../entities/usage.entity';
import { User } from '../../users/entities/user.entity';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { CreatePortalSessionDto } from '../dto/create-portal-session.dto';
import { UpdateSubscriptionDto } from '../dto/update-subscription.dto';
import { format } from 'date-fns';

export interface SubscriptionUsage {
  currentPeriodTrades: number;
  tradeLimit: number;
  accountsUsed: number;
  accountLimit: number;
}

export interface BillingInfo {
  paymentMethods: any[];
  upcomingInvoice: any;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(UsageTracking)
    private usageRepository: Repository<UsageTracking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private stripeService: StripeService,
  ) {}

  async createCheckoutSession(
    userId: string,
    createCheckoutSessionDto: CreateCheckoutSessionDto,
  ): Promise<{ url: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    // Create Stripe customer if none exists
    if (!subscription || !subscription.stripeCustomerId) {
      const customer = await this.stripeService.createCustomer(
        user.email,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      );

      if (!subscription) {
        subscription = this.subscriptionRepository.create({
          userId,
          stripeCustomerId: customer.id,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
        });
        await this.subscriptionRepository.save(subscription);
      } else {
        subscription.stripeCustomerId = customer.id;
        await this.subscriptionRepository.save(subscription);
      }
    }

    const session = await this.stripeService.createCheckoutSession(
      createCheckoutSessionDto.priceId,
      subscription.stripeCustomerId,
      createCheckoutSessionDto.successUrl,
      createCheckoutSessionDto.cancelUrl,
    );

    if (!session.url) {
      throw new Error('Failed to create checkout session');
    }

    return { url: session.url };
  }

  async createPortalSession(
    userId: string,
    createPortalSessionDto: CreatePortalSessionDto,
  ): Promise<{ url: string }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      throw new BadRequestException('No active subscription found');
    }

    const session = await this.stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
      createPortalSessionDto.return_url,
    );

    return { url: session.url };
  }

  async getCurrentSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      // Create default free subscription
      subscription = this.subscriptionRepository.create({
        userId,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      });
      await this.subscriptionRepository.save(subscription);
    }

    return subscription;
  }

  async cancelSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    subscription.cancelAtPeriodEnd = true;
    subscription.canceledAt = new Date();
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  async reactivateSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new NotFoundException('No subscription found');
    }

    await this.stripeService.reactivateSubscription(subscription.stripeSubscriptionId);

    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = null;
    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  async updateSubscription(
    userId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    await this.stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      updateSubscriptionDto.priceId,
    );

    // Note: Actual subscription details will be updated via webhook
    return subscription;
  }

  async getBillingInfo(userId: string): Promise<BillingInfo> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return {
        paymentMethods: [],
        upcomingInvoice: null,
      };
    }

    const [paymentMethods, upcomingInvoice] = await Promise.all([
      this.stripeService.getCustomerPaymentMethods(subscription.stripeCustomerId),
      this.stripeService.getUpcomingInvoice(subscription.stripeCustomerId),
    ]);

    return {
      paymentMethods,
      upcomingInvoice: upcomingInvoice
        ? {
            amount: upcomingInvoice.amount_due / 100,
            date: new Date(upcomingInvoice.period_end * 1000),
          }
        : null,
    };
  }

  async getUsage(userId: string): Promise<SubscriptionUsage> {
    const subscription = await this.getCurrentSubscription(userId);
    const currentPeriod = format(new Date(), 'yyyy-MM');

    let usage = await this.usageRepository.findOne({
      where: { userId, period: currentPeriod },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId,
        period: currentPeriod,
        tradesCount: 0,
        accountsCount: 0,
        apiCalls: 0,
      });
      await this.usageRepository.save(usage);
    }

    const limits = this.getSubscriptionLimits(subscription.tier);

    return {
      currentPeriodTrades: usage.tradesCount,
      tradeLimit: limits.trades,
      accountsUsed: usage.accountsCount,
      accountLimit: limits.accounts,
    };
  }

  async incrementTradeUsage(userId: string): Promise<void> {
    const currentPeriod = format(new Date(), 'yyyy-MM');

    let usage = await this.usageRepository.findOne({
      where: { userId, period: currentPeriod },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId,
        period: currentPeriod,
        tradesCount: 1,
        accountsCount: 0,
        apiCalls: 0,
        lastTradeAt: new Date(),
      });
    } else {
      usage.tradesCount += 1;
      usage.lastTradeAt = new Date();
    }

    await this.usageRepository.save(usage);
  }

  async incrementAccountUsage(userId: string): Promise<void> {
    const currentPeriod = format(new Date(), 'yyyy-MM');

    let usage = await this.usageRepository.findOne({
      where: { userId, period: currentPeriod },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId,
        period: currentPeriod,
        tradesCount: 0,
        accountsCount: 1,
        apiCalls: 0,
      });
    } else {
      usage.accountsCount += 1;
    }

    await this.usageRepository.save(usage);
  }

  async checkUsageLimit(userId: string, feature: 'trades' | 'accounts'): Promise<boolean> {
    const usage = await this.getUsage(userId);

    if (feature === 'trades') {
      return usage.tradeLimit === 0 || usage.currentPeriodTrades < usage.tradeLimit;
    } else {
      return usage.accountLimit === 0 || usage.accountsUsed < usage.accountLimit;
    }
  }

  private getSubscriptionLimits(tier: SubscriptionTier) {
    switch (tier) {
      case SubscriptionTier.FREE:
        return { trades: 10, accounts: 1 };
      case SubscriptionTier.STARTER:
        return { trades: 100, accounts: 3 };
      case SubscriptionTier.PROFESSIONAL:
        return { trades: 500, accounts: 10 };
      case SubscriptionTier.ENTERPRISE:
        return { trades: 0, accounts: 0 }; // 0 means unlimited
      default:
        return { trades: 10, accounts: 1 };
    }
  }

  // Webhook handlers
  async handleSubscriptionCreated(stripeSubscription: any): Promise<void> {
    const customerId = stripeSubscription.customer;
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeCustomerId: customerId },
    });

    if (subscription) {
      subscription.stripeSubscriptionId = stripeSubscription.id;
      subscription.stripePriceId = stripeSubscription.items.data[0].price.id;
      subscription.status = stripeSubscription.status as SubscriptionStatus;
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      subscription.tier = this.mapPriceIdToTier(subscription.stripePriceId);
      
      await this.subscriptionRepository.save(subscription);
      this.logger.log(`Updated subscription for customer ${customerId}`);
    }
  }

  async handleSubscriptionUpdated(stripeSubscription: any): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (subscription) {
      subscription.stripePriceId = stripeSubscription.items.data[0].price.id;
      subscription.status = stripeSubscription.status as SubscriptionStatus;
      subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
      subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
      subscription.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
      subscription.tier = this.mapPriceIdToTier(subscription.stripePriceId);

      await this.subscriptionRepository.save(subscription);
      this.logger.log(`Updated subscription ${stripeSubscription.id}`);
    }
  }

  async handleSubscriptionDeleted(stripeSubscription: any): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.tier = SubscriptionTier.FREE;
      subscription.canceledAt = new Date();

      await this.subscriptionRepository.save(subscription);
      this.logger.log(`Canceled subscription ${stripeSubscription.id}`);
    }
  }

  private mapPriceIdToTier(priceId: string): SubscriptionTier {
    // Map Stripe price IDs to subscription tiers
    // These would be configured based on your actual Stripe price IDs
    const priceIdMap: Record<string, SubscriptionTier> = {
      // Add your actual Stripe price IDs here
      'price_1RVXzGKCBJK5GhoVfFjtd5Q6': SubscriptionTier.STARTER,
      'price_1RVYDHKCBJK5GhoVMfo4GJZ7': SubscriptionTier.STARTER,
      'price_1RVXzjKCBJK5GhoVz7V8Y9T9': SubscriptionTier.PROFESSIONAL,
      'price_1RVYCiKCBJK5GhoV8hhcy56l': SubscriptionTier.PROFESSIONAL,
      'price_1RVY09KCBJK5GhoVosiTa4QL': SubscriptionTier.ENTERPRISE,
      'price_1RVYC4KCBJK5GhoVFuGcwaAa': SubscriptionTier.ENTERPRISE,
    };

    return priceIdMap[priceId] || SubscriptionTier.FREE;
  }
} 