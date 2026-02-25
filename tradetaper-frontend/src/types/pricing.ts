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

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  provider: 'stripe' | 'razorpay';
  providerSubscriptionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingInfo {
  id: string;
  userId: string;
  paymentMethodId?: string;
  last4?: string;
  brand?: string;
  name?: string;
  email?: string;
  subscription: Subscription;
}

export interface CreateCheckoutSessionRequest {
  planId: string;
  interval: 'monthly' | 'yearly';
}

export interface CreateCheckoutSessionResponse {
  sessionId?: string;
  url?: string;
  orderId?: string;
  key?: string;
}
