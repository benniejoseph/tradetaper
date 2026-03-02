import { PricingTier } from '@/types/pricing';

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
