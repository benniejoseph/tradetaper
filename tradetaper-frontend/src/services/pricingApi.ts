import { authApiClient } from './api';
import { 
  CreateCheckoutSessionRequest, 
  CreateCheckoutSessionResponse, 
  Subscription, 
  BillingInfo 
} from '@/types/pricing';

export const pricingApi = {
  // Create Stripe checkout session
  createCheckoutSession: async (data: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> => {
    const response = await authApiClient.post<CreateCheckoutSessionResponse>('/subscriptions/create-checkout-session', data);
    return response.data;
  },

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

  // Get billing information
  getBillingInfo: async (): Promise<BillingInfo> => {
    const response = await authApiClient.get<BillingInfo>('/subscriptions/billing-info');
    return response.data;
  },

  // Cancel subscription
  cancelSubscription: async (): Promise<{ message: string }> => {
    const response = await authApiClient.post<{ message: string }>('/subscriptions/cancel');
    return response.data;
  },

  // Reactivate subscription
  reactivateSubscription: async (): Promise<{ message: string }> => {
    const response = await authApiClient.post<{ message: string }>('/subscriptions/reactivate');
    return response.data;
  },

  // Update subscription (change plan)
  updateSubscription: async (priceId: string): Promise<Subscription> => {
    const response = await authApiClient.post<Subscription>('/subscriptions/update', { priceId });
    return response.data;
  },

  // Create customer portal session
  createPortalSession: async (returnUrl: string): Promise<{ url: string }> => {
    const response = await authApiClient.post<{ url: string }>('/subscriptions/create-portal-session', { 
      return_url: returnUrl 
    });
    return response.data;
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
}; 