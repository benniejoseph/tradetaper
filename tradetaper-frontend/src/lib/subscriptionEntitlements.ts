type SubscriptionSnapshotLike = {
  plan?: string | null;
  status?: string | null;
  currentPeriodEnd?: string | Date | null;
};

export type EntitlementPlan = 'free' | 'essential' | 'premium';

const normalizePlan = (plan?: string | null): EntitlementPlan => {
  const normalized = String(plan || '')
    .trim()
    .toLowerCase();
  return normalized === 'essential' || normalized === 'premium'
    ? normalized
    : 'free';
};

export const hasPaidSubscriptionEntitlement = (
  subscription?: SubscriptionSnapshotLike | null,
): boolean => {
  const status = String(subscription?.status || '')
    .trim()
    .toLowerCase();

  if (status === 'active' || status === 'trialing') {
    return true;
  }

  if (status === 'canceled' || status === 'cancelled') {
    const currentPeriodEnd = subscription?.currentPeriodEnd;
    if (!currentPeriodEnd) {
      return false;
    }

    const periodEndMs = new Date(currentPeriodEnd).getTime();
    return Number.isFinite(periodEndMs) && periodEndMs > Date.now();
  }

  return false;
};

export const resolveEntitlementPlan = (
  subscription?: SubscriptionSnapshotLike | null,
): EntitlementPlan => {
  return hasPaidSubscriptionEntitlement(subscription)
    ? normalizePlan(subscription?.plan)
    : 'free';
};
