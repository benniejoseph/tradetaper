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

export interface PlanLimits {
  manualAccounts: number | 'unlimited';
  mt5Accounts: number | 'unlimited';
  trades: number | 'unlimited';
  strategies: number | 'unlimited';
  notes: number | 'unlimited';
  storage: string;
  marketIntelligence: 'basic' | 'full'; 
  discipline: boolean;
  backtesting: 'restricted' | 'full';
  psychology: boolean;
  reports: boolean;
  aiAnalysis: boolean;
}

export interface PlanDetails {
  id: string;
  name: string;
  displayName: string;
  description: string;
  features: string[];
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
}
