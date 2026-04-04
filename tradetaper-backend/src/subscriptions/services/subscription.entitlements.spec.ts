/// <reference types="jest" />
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { SubscriptionService } from './subscription.service';

const buildSubscription = (
  overrides: Partial<Subscription> = {},
): Subscription =>
  ({
    id: 'sub_1',
    userId: 'user_1',
    plan: 'essential',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: new Date(Date.now() + 60_000),
    ...overrides,
  }) as Subscription;

describe('SubscriptionService entitlement behavior', () => {
  const baseContext = () =>
    ({
      logger: {
        log: jest.fn(),
        warn: jest.fn(),
      },
    }) as unknown as SubscriptionService;

  describe('resolvePlanForEntitlements', () => {
    it('keeps paid entitlement for canceled subscriptions until current period end', () => {
      const context = baseContext();
      const subscription = buildSubscription({
        plan: 'essential',
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const plan = SubscriptionService.prototype.resolvePlanForEntitlements.call(
        context,
        subscription,
      );

      expect(plan).toBe('essential');
    });

    it('downgrades canceled subscriptions after current period end', () => {
      const context = baseContext();
      const subscription = buildSubscription({
        plan: 'essential',
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const plan = SubscriptionService.prototype.resolvePlanForEntitlements.call(
        context,
        subscription,
      );

      expect(plan).toBe('free');
    });
  });

  describe('hasFeatureAccess', () => {
    it('allows aiCoach for canceled-at-period-end essential users', async () => {
      const logger = {
        log: jest.fn(),
        warn: jest.fn(),
      };
      const subscription = buildSubscription({
        plan: 'essential',
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const context = {
        logger,
        getOrCreateSubscription: jest.fn().mockResolvedValue(subscription),
        resolvePlanForEntitlements:
          SubscriptionService.prototype.resolvePlanForEntitlements,
        getPricingPlan: jest.fn().mockReturnValue({
          id: 'essential',
          name: 'Essential',
          displayName: 'Essential',
          priceMonthly: 0,
          priceYearly: 0,
          razorpayPlanMonthlyId: '',
          razorpayPlanYearlyId: '',
          features: [],
          limits: {
            manualAccounts: 'unlimited',
            mt5Accounts: 2,
            trades: 'unlimited',
            notes: 'unlimited',
            strategies: 'unlimited',
            discipline: true,
            aiAnalysis: false,
            backtesting: 'none',
            marketIntelligence: 'basic',
            psychology: false,
            reports: false,
          },
        }),
      } as unknown as SubscriptionService;

      const hasAccess = await SubscriptionService.prototype.hasFeatureAccess.call(
        context,
        'user_1',
        'aiCoach',
      );

      expect(hasAccess).toBe(true);
    });

    it('blocks aiCoach once canceled essential subscription is fully expired', async () => {
      const logger = {
        log: jest.fn(),
        warn: jest.fn(),
      };
      const subscription = buildSubscription({
        plan: 'essential',
        status: SubscriptionStatus.CANCELED,
        currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });

      const context = {
        logger,
        getOrCreateSubscription: jest.fn().mockResolvedValue(subscription),
        resolvePlanForEntitlements:
          SubscriptionService.prototype.resolvePlanForEntitlements,
        getPricingPlan: jest.fn().mockReturnValue({
          id: 'free',
          name: 'Free',
          displayName: 'Free',
          priceMonthly: 0,
          priceYearly: 0,
          razorpayPlanMonthlyId: '',
          razorpayPlanYearlyId: '',
          features: [],
          limits: {
            manualAccounts: 'unlimited',
            mt5Accounts: 0,
            trades: 10,
            notes: 10,
            strategies: 2,
            discipline: false,
            aiAnalysis: false,
            backtesting: 'none',
            marketIntelligence: 'basic',
            psychology: false,
            reports: false,
          },
        }),
      } as unknown as SubscriptionService;

      const hasAccess = await SubscriptionService.prototype.hasFeatureAccess.call(
        context,
        'user_1',
        'aiCoach',
      );

      expect(hasAccess).toBe(false);
    });
  });
});
