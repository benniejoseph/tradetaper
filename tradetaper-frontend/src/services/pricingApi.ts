import { authApiClient } from './api';
import { 
  Subscription, 
  BillingInfo 
} from '@/types/pricing';
import {
  BillingAttributionPayload,
  getBillingAttributionForCheckout,
} from '@/lib/billingAttribution';

type BillingCurrencyCode = 'INR' | 'USD';
type BillingPeriod = 'monthly' | 'yearly';

interface BackendSubscriptionUsage {
  trades: number;
  mt5Accounts: number;
  periodStart?: string;
  periodEnd?: string;
  currentPeriodTrades?: number;
  tradeLimit?: number;
  accountsUsed?: number;
  accountLimit?: number;
}

interface BackendCurrentSubscription {
  currentPlan: string;
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  interval?: string;
  price?: number | string;
  usage: BackendSubscriptionUsage;
}

const normalizeInterval = (
  interval?: string,
): Subscription['interval'] | undefined => {
  if (!interval) return undefined;
  if (interval === 'month' || interval === 'year') return interval;
  if (interval === 'monthly') return 'month';
  if (interval === 'yearly') return 'year';
  return undefined;
};

const mapCurrentToLegacySubscription = (
  current: BackendCurrentSubscription,
): Subscription => ({
  id: 'current-subscription',
  userId: '',
  planId: current.currentPlan,
  interval: normalizeInterval(current.interval),
  price:
    typeof current.price === 'number'
      ? current.price
      : Number(current.price ?? 0),
  status: current.status as Subscription['status'],
  currentPeriodStart:
    current.currentPeriodStart ||
    current.usage?.periodStart ||
    current.currentPeriodEnd,
  currentPeriodEnd: current.currentPeriodEnd,
  cancelAtPeriodEnd: current.cancelAtPeriodEnd,
  provider: 'razorpay',
  providerSubscriptionId: '',
  createdAt:
    current.currentPeriodStart ||
    current.usage?.periodStart ||
    current.currentPeriodEnd,
  updatedAt: current.currentPeriodEnd,
});

export const pricingApi = {
  // Get current subscription
  getCurrentSubscription: async (): Promise<Subscription | null> => {
    try {
      const response =
        await authApiClient.get<BackendCurrentSubscription>('/subscriptions/current');
      return mapCurrentToLegacySubscription(response.data);
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
    const response =
      await authApiClient.get<BackendSubscriptionUsage>('/subscriptions/usage');
    return {
      currentPeriodTrades:
        response.data.currentPeriodTrades ?? response.data.trades ?? 0,
      tradeLimit: response.data.tradeLimit ?? 0,
      accountsUsed: response.data.accountsUsed ?? response.data.mt5Accounts ?? 0,
      accountLimit: response.data.accountLimit ?? 0,
    };
  },

  // Create Razorpay subscription
  createRazorpaySubscription: async (
    planId: string,
    period: BillingPeriod,
    currency?: BillingCurrencyCode,
    discountCode?: string,
    attribution?: BillingAttributionPayload,
  ): Promise<{
      subscriptionId: string;
      key: string;
      currency: string;
      amount: number;       // plan price in major currency unit (e.g. 19.99 for ₹19.99)
      baseAmountMinor: number;
      name: string;
      description: string;
      customer_id: string;
      appliedDiscount?: {
        code: string;
        codeType: 'coupon' | 'referral';
        discountAmountMinor: number;
        payableAmountMinor: number;
      } | null;
  }> => {
      const payload = {
        planId,
        period,
        currency,
        discountCode,
        attribution: attribution || getBillingAttributionForCheckout(),
      };
      const response = await authApiClient.post(
        '/subscriptions/create-razorpay-subscription',
        payload,
      );
      return response.data;
  },

  previewDiscount: async (
    planId: string,
    period: BillingPeriod,
    discountCode: string,
    currency?: BillingCurrencyCode,
  ): Promise<{
    valid: boolean;
    code: string;
    codeType: 'coupon' | 'referral';
    discountType: 'percentage' | 'flat';
    discountValue: number;
    baseAmountMinor: number;
    discountAmountMinor: number;
    payableAmountMinor: number;
    currency: BillingCurrencyCode;
    planId: string;
    period: BillingPeriod;
    message: string;
  }> => {
    const response = await authApiClient.post('/subscriptions/discount-preview', {
      planId,
      period,
      currency,
      discountCode,
    });
    return response.data;
  },

  getReferralCode: async (): Promise<{ code: string; shareUrl: string }> => {
    const response = await authApiClient.get('/subscriptions/referral-code');
    return response.data;
  },

  getBillingInfo: async (): Promise<BillingInfo> => {
      const response =
        await authApiClient.get<BackendCurrentSubscription>('/subscriptions/billing');
      return {
        id: 'billing',
        userId: '',
        subscription: mapCurrentToLegacySubscription(response.data),
      };
  },
  cancelSubscription: async (): Promise<{ success: boolean }> => {
      const response = await authApiClient.post('/subscriptions/cancel');
      return response.data;
  },
  reactivateSubscription: async (): Promise<{ success: boolean }> => {
      const response = await authApiClient.post('/subscriptions/reactivate');
      return response.data;
  }
}; 
