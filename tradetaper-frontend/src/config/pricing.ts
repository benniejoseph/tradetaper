import { PricingTier } from '@/types/pricing';
import type { CurrencyCode } from '@/hooks/useCurrency';

export type PlanId = 'free' | 'essential' | 'premium';

// ── INR prices (shown to Indian users) ────────────────────────────────────────
// monthly / yearly in whole rupees (₹)
export const INR_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free:      { monthly: 0,    yearly: 0 },
  essential: { monthly: 999,  yearly: 9999  }, // ₹999/mo  · ₹9,999/yr
  premium:   { monthly: 1999, yearly: 19999 }, // ₹1,999/mo · ₹19,999/yr
};

// MT5 add-on slot — per-currency
export const MT5_SLOT_PRICE: Record<CurrencyCode, { amount: number; label: string }> = {
  INR: { amount: 999,   label: '₹999' },
  USD: { amount: 12,    label: '$12'  },
};

/**
 * Get the display price for a plan/period/currency combination.
 * Returns the numeric amount (no symbol).
 */
export function getPlanPrice(
  tierId: string,
  period: 'monthly' | 'yearly',
  currency: CurrencyCode,
): number {
  if (currency === 'INR') {
    return INR_PRICES[tierId]?.[period] ?? 0;
  }
  // USD — use PRICING_TIERS (monthly) or PRICING_TIERS_ANNUAL (yearly)
  const tier =
    period === 'monthly'
      ? PRICING_TIERS.find((t) => t.id === tierId)
      : PRICING_TIERS_ANNUAL.find((t) => t.id === tierId);
  return tier?.price ?? 0;
}

/**
 * Format a plan price for display (e.g. "₹999", "$9.99", "Free").
 */
export function formatPlanPrice(
  tierId: string,
  period: 'monthly' | 'yearly',
  currency: CurrencyCode,
): string {
  const amount = getPlanPrice(tierId, period, currency);
  if (amount === 0) return 'Free';
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `$${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Start journaling with clear limits',
    price: 0,
    interval: 'month',
    tradeLimit: 50,
    accountLimit: 0,
    features: [
      'Unlimited manual & import accounts',
      '0 MT5 auto-sync slots (MetaApi)',
      '50 trades per month',
      '3 strategies',
      '0 notes (note creation locked)',
      'Core Dashboard + core Analytics',
      'Market Intelligence basic (Economic Calendar, Polymarket, COT history)',
      'Journal, trade logging, and strategy management',
      'Community, Trader Mind, AI Coach, and Backtesting are locked',
      'No AI analysis, Mentor, Prop Firm, Psychology, or Reports (Premium only)',
    ],
  },
  {
    id: 'essential',
    name: 'Essential',
    description: 'For disciplined traders who need more depth',
    price: 9.99,
    interval: 'month',
    tradeLimit: 500,
    accountLimit: 2,
    features: [
      'Unlimited manual & import accounts',
      '2 MT5 auto-sync slots (MetaApi)',
      '500 trades per month',
      '7 strategies',
      '50 notes',
      'Trader Mind (Discipline) access',
      'AI Trader Coach access (120 AI calls/month)',
      'Community access',
      'Dashboard AI Coach insight access',
      'Premium AI tools remain locked (Backtesting, Mentor, Prop Firm, Advanced Analytics, Psychology, Reports)',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Complete access for serious traders',
    price: 19.99,
    interval: 'month',
    recommended: true,
    tradeLimit: 0,
    accountLimit: 4,
    features: [
      'Unlimited trades, strategies, and notes',
      '4 MT5 auto-sync slots (MetaApi)',
      'Trader Mind + AI Psychology insights',
      'AI Trader Coach (unlimited AI calls)',
      'Mentor AI access',
      'Market Intelligence AI analysis',
      'Advanced Analytics',
      'Backtesting + Replay sessions',
      'Prop Firm tracker',
      'Reports (weekly AI performance report) and full premium feature access',
    ],
  },
];

// Annual pricing with discount
export const PRICING_TIERS_ANNUAL: PricingTier[] = [
  {
    ...PRICING_TIERS[0], // Free tier remains the same
  },
  {
    ...PRICING_TIERS[1],
    price: 99.99, // 2 months free
    interval: 'year',
  },
  {
    ...PRICING_TIERS[2],
    price: 199.99, // 2 months free
    interval: 'year',
  },
];


export const getPricingTier = (tierId: string, interval: 'month' | 'year' = 'month'): PricingTier | undefined => {
  const tiers = interval === 'year' ? PRICING_TIERS_ANNUAL : PRICING_TIERS;
  return tiers.find(tier => tier.id === tierId);
};

export const getDiscountPercentage = (monthlyPrice: number, yearlyPrice: number): number => {
  const monthlyTotal = monthlyPrice * 12;
  return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
};

const PLAN_CAPABILITY_MAP: Record<PlanId, string[]> = {
  free: [
    'Unlimited manual/import accounts',
    'Core dashboard + core analytics',
    'Basic market intelligence',
    '50 trades per month',
    '3 strategies',
  ],
  essential: [
    'Unlimited manual/import accounts',
    'Core dashboard + core analytics',
    'Basic market intelligence',
    '500 trades per month',
    '7 strategies',
    '50 notes',
    '2 MT5 auto-sync slots',
    'Trader Mind (Discipline)',
    'AI Trader Coach (120 calls/month)',
    'Community access',
    'Dashboard AI Coach Insight',
    'Reports locked (Premium only)',
  ],
  premium: [
    'Unlimited manual/import accounts',
    'Core dashboard + core analytics',
    'Market intelligence AI analysis',
    'Unlimited trades',
    'Unlimited strategies',
    'Unlimited notes',
    '4 MT5 auto-sync slots',
    'Trader Mind + AI Psychology insights',
    'AI Trader Coach (unlimited calls)',
    'Community access',
    'Dashboard AI Coach Insight',
    'Advanced analytics',
    'Backtesting + replay',
    'Mentor AI',
    'Prop firm tracker',
    'Reports (weekly AI performance report)',
  ],
};

const normalizePlanId = (planId: string): PlanId => {
  if (planId === 'essential' || planId === 'premium') {
    return planId;
  }
  return 'free';
};

const getPlanName = (planId: PlanId): string =>
  PRICING_TIERS.find((tier) => tier.id === planId)?.name ?? 'Free';

export const getUpgradeHighlights = (
  fromPlanId: string,
  toPlanId: string,
  maxItems = 6,
): string[] => {
  const from = normalizePlanId(fromPlanId);
  const to = normalizePlanId(toPlanId);

  if (from === to) {
    return [];
  }

  const fromCapabilities = new Set(PLAN_CAPABILITY_MAP[from]);
  return PLAN_CAPABILITY_MAP[to]
    .filter((capability) => !fromCapabilities.has(capability))
    .slice(0, maxItems);
};

export const getNextUpgradePlanId = (planId: string): PlanId | null => {
  const normalized = normalizePlanId(planId);
  if (normalized === 'free') return 'essential';
  if (normalized === 'essential') return 'premium';
  return null;
};

export const getUpgradePreviewForPlan = (
  currentPlanId: string,
  maxItems = 6,
): {
  fromPlanId: PlanId;
  toPlanId: PlanId;
  toPlanName: string;
  highlights: string[];
} | null => {
  const fromPlanId = normalizePlanId(currentPlanId);
  const toPlanId = getNextUpgradePlanId(fromPlanId);

  if (!toPlanId) {
    return null;
  }

  return {
    fromPlanId,
    toPlanId,
    toPlanName: getPlanName(toPlanId),
    highlights: getUpgradeHighlights(fromPlanId, toPlanId, maxItems),
  };
};
