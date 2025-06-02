import { PricingTier } from '@/types/pricing';

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with trading journals',
    price: 0,
    interval: 'month',
    stripePriceId: '', // Free tier doesn't need Stripe price ID
    tradeLimit: 10,
    accountLimit: 1,
    features: [
      'Up to 10 trades per month',
      '1 trading account',
      'Basic trade analytics',
      'Trade notes and journaling',
      'Chart upload',
      'Mobile responsive',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal for individual traders',
    price: 9.99,
    interval: 'month',
    stripePriceId: 'price_starter_monthly', // Will be created in Stripe
    tradeLimit: 100,
    accountLimit: 3,
    features: [
      'Up to 100 trades per month',
      '3 trading accounts',
      'Advanced analytics & reports',
      'Trade tags & ICT concepts',
      'Risk management tools',
      'Data export (CSV, PDF)',
      'Email support',
      'Real-time sync',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Best for serious traders',
    price: 19.99,
    interval: 'month',
    stripePriceId: 'price_professional_monthly',
    recommended: true,
    tradeLimit: 500,
    accountLimit: 10,
    features: [
      'Up to 500 trades per month',
      '10 trading accounts',
      'Advanced performance metrics',
      'Custom trade categories',
      'Backtesting capabilities',
      'API access',
      'Priority email support',
      'Advanced risk analytics',
      'Multi-timeframe analysis',
      'Bulk trade import',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For trading teams and professionals',
    price: 49.99,
    interval: 'month',
    stripePriceId: 'price_enterprise_monthly',
    features: [
      'Unlimited trades',
      'Unlimited accounts',
      'Team collaboration',
      'Advanced reporting suite',
      'Custom integrations',
      'White-label options',
      'Dedicated account manager',
      'Phone support',
      'SLA guarantee',
      'Advanced API access',
      'Custom analytics dashboard',
      'Regulatory compliance tools',
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
    stripePriceId: 'price_starter_yearly',
  },
  {
    ...PRICING_TIERS[2],
    price: 199.99, // 2 months free
    interval: 'year',
    stripePriceId: 'price_professional_yearly',
  },
  {
    ...PRICING_TIERS[3],
    price: 499.99, // 2 months free
    interval: 'year',
    stripePriceId: 'price_enterprise_yearly',
  },
];

export const getPricingTier = (tierId: string, interval: 'month' | 'year' = 'month'): PricingTier | undefined => {
  const tiers = interval === 'year' ? PRICING_TIERS_ANNUAL : PRICING_TIERS;
  return tiers.find(tier => tier.id === tierId);
};

export const getPricingTierByPriceId = (priceId: string): PricingTier | undefined => {
  const allTiers = [...PRICING_TIERS, ...PRICING_TIERS_ANNUAL];
  return allTiers.find(tier => tier.stripePriceId === priceId);
};

export const getDiscountPercentage = (monthlyPrice: number, yearlyPrice: number): number => {
  const monthlyTotal = monthlyPrice * 12;
  return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
}; 