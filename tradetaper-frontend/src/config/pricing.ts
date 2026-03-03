import { PricingTier } from '@/types/pricing';
import type { CurrencyCode } from '@/hooks/useCurrency';

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
    description: 'Perfect for getting started with trading journals',
    price: 0,
    interval: 'month',
    tradeLimit: 10,
    accountLimit: 1, // 1 MT5 Auto-Sync Account
    features: [
      'Up to 10 trades per month',
      '1 MetaApi auto-sync account',
      'Unlimited manual & import accounts',
      'Basic trade analytics & journaling',
      'Chart image uploads',
      'Mobile responsive',
    ],
  },
  {
    id: 'essential',
    name: 'Essential',
    description: 'Ideal for disciplined manual traders',
    price: 9.99,
    interval: 'month',
    tradeLimit: 100,
    accountLimit: 2, // 2 MT5 Auto-Sync Accounts
    features: [
      'Up to 100 trades per month',
      '2 MetaApi auto-sync accounts',
      'Trader Discipline Tracker',
      'Community & Leaderboards',
      'Advanced Performance & Risk Analytics',
      'Trade tags & ICT concepts',
      'Data export (CSV, PDF)',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Best for funded traders & ICT students',
    price: 19.99,
    interval: 'month',
    recommended: true,
    tradeLimit: 500,
    accountLimit: 3, // 3 MT5 Auto-Sync Accounts
    features: [
      'Up to 500 trades per month',
      '3 MetaApi auto-sync accounts',
      'Unlimited ICT AI Mentor',
      'AI Psychology Profiling',
      'AI Live Chart & Pattern Analysis',
      'Prop Firm Challenge Tracker',
      'Advanced Backtesting',
      'Priority email support',
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
