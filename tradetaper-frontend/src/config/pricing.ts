import { PricingTier } from '@/types/pricing';

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with trading journals',
    price: 0,
    interval: 'month',
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
    id: 'essential',
    name: 'Essential',
    description: 'Ideal for individual traders',
    price: 9.99,
    interval: 'month',
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
    id: 'premium',
    name: 'Premium',
    description: 'Best for serious traders',
    price: 19.99,
    interval: 'month',
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