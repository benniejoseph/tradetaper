export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  tradeLimit: number;
  accountLimit: number;
  features: string[];
  recommended?: boolean;
}
