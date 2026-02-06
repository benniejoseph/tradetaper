import api from './api';

export interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  features: string[];
  priceMonthly: number; // in cents/paisa usually, but backend sends raw number? Need to check. Backend sends 999 for $9.99.
  priceYearly: number;
  razorpayPlanMonthlyId: string;
  razorpayPlanYearlyId: string;
  // ... other fields
}

export interface BillingInfo {
  currentPlan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export const billingService = {
  getPricingPlans: async (): Promise<PricingPlan[]> => {
    const response = await api.get('/subscriptions/pricing-plans');
    return response.data;
  },

  getCurrentSubscription: async (): Promise<BillingInfo> => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  createRazorpaySubscription: async (planId: string, period: 'monthly' | 'yearly') => {
    const response = await api.post('/subscriptions/create-razorpay-subscription', {
      planId,
      period,
    });
    return response.data;
  },
};
