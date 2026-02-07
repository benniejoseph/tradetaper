import { authApiClient } from './api';
import { 
  CreateCheckoutSessionRequest, 
  CreateCheckoutSessionResponse, 
  Subscription, 
  BillingInfo 
} from '@/types/pricing';

export const pricingApi = {
  // Get current subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await authApiClient.get<Subscription>('/subscriptions/current');
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null; // No active subscription
        }
      }
      throw error;
    }
  },

  // Get subscription usage/limits
  getUsage: async (): Promise<{
    currentPeriodTrades: number;
    tradeLimit: number;
    accountsUsed: number;
    accountLimit: number;
  }> => {
    const response = await authApiClient.get('/subscriptions/usage');
    return response.data;
  },

  // Create Razorpay subscription
  createRazorpaySubscription: async (planId: string, period: 'monthly' | 'yearly'): Promise<{
      subscriptionId: string;
      key: string;
      currency: string;
      name: string;
      description: string;
      customer_id: string;
  }> => {
      const response = await authApiClient.post('/subscriptions/create-razorpay-subscription', {
          planId,
          period
      });
      return response.data;
  }
}; 