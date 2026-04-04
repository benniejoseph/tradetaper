import { describe, expect, it, vi } from 'vitest';
import {
  hasPaidSubscriptionEntitlement,
  resolveEntitlementPlan,
} from './subscriptionEntitlements';

describe('subscriptionEntitlements', () => {
  it('treats canceled subscriptions as paid while current period is in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-04T00:00:00.000Z'));

    const subscription = {
      plan: 'essential',
      status: 'canceled',
      currentPeriodEnd: '2026-04-10T00:00:00.000Z',
    };

    expect(hasPaidSubscriptionEntitlement(subscription)).toBe(true);
    expect(resolveEntitlementPlan(subscription)).toBe('essential');

    vi.useRealTimers();
  });

  it('downgrades canceled subscriptions to free after current period end', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-11T00:00:00.000Z'));

    const subscription = {
      plan: 'essential',
      status: 'canceled',
      currentPeriodEnd: '2026-04-10T00:00:00.000Z',
    };

    expect(hasPaidSubscriptionEntitlement(subscription)).toBe(false);
    expect(resolveEntitlementPlan(subscription)).toBe('free');

    vi.useRealTimers();
  });

  it('keeps active paid plans entitled regardless of period end', () => {
    const subscription = {
      plan: 'premium',
      status: 'active',
      currentPeriodEnd: null,
    };

    expect(hasPaidSubscriptionEntitlement(subscription)).toBe(true);
    expect(resolveEntitlementPlan(subscription)).toBe('premium');
  });
});
