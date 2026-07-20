"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { 
  selectCurrentSubscription, 
  selectUsage,
  fetchBillingInfo,
  fetchUsage,
  cancelSubscription,
  reactivateSubscription 
} from '@/store/features/subscriptionSlice';
import { pricingApi } from '@/services/pricingApi';
import { PRICING_TIERS, getPlanPrice, formatPlanPrice, getUpgradePreviewForPlan } from '@/config/pricing';
import { useCurrency } from '@/hooks/useCurrency';
import { 
  FaCreditCard, 
  FaHistory, 
  FaChartBar, 
  FaCheckCircle,
  FaSpinner,
  FaTimes,
  FaDownload,
  FaCrown,
  FaShieldAlt,
  FaBolt
} from 'react-icons/fa';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AlertModal from '@/components/ui/AlertModal';
import { trackDatafastPayment } from '@/utils/datafast';
import { loadRazorpayScript } from '@/lib/razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

type BillingPeriod = 'monthly' | 'yearly';
type CheckoutPlanId = 'essential' | 'premium';

interface DiscountPreview {
  valid: boolean;
  code: string;
  codeType: 'coupon' | 'referral';
  discountType: 'percentage' | 'flat';
  discountValue: number;
  baseAmountMinor: number;
  discountAmountMinor: number;
  payableAmountMinor: number;
  currency: 'INR' | 'USD';
  planId: string;
  period: BillingPeriod;
  message: string;
}

const normalizeDiscountCode = (value: string | null | undefined): string => {
  return String(value || '').trim().toUpperCase();
};

const emitBillingEvent = (
  event: string,
  properties?: Record<string, string | number | boolean | null | undefined>,
) => {
  if (typeof window === 'undefined') {
    return;
  }
  void import('@/lib/observability/client').then(({ captureClientEvent }) => {
    captureClientEvent(event, properties);
  });
};

const isCheckoutPlanId = (value: string | null): value is CheckoutPlanId => {
  return value === 'essential' || value === 'premium';
};

export default function BillingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSubscription = useSelector(selectCurrentSubscription);
  const authUser = useSelector((state: RootState) => state.auth.user);
  const usage = useSelector(selectUsage);
  const { currency, loading: currencyLoading } = useCurrency();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [initUpgrade, setInitUpgrade] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, title: 'Notice', message: '' });
  const [discountCode, setDiscountCode] = useState('');
  const [discountPreview, setDiscountPreview] = useState<DiscountPreview | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const unlockViewedKeyRef = useRef<string | null>(null);
  const closeAlert = () => setAlertState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (message: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message });

  useEffect(() => {
    dispatch(fetchBillingInfo());
    dispatch(fetchUsage());
  }, [dispatch]);

  // Handle URL Query Params for Upgrade
  useEffect(() => {
    const planId = searchParams.get('plan');
    const interval = (searchParams.get('interval') as BillingPeriod) || 'monthly';
    const codeFromQuery = normalizeDiscountCode(
      searchParams.get('code') ||
      searchParams.get('coupon') ||
      searchParams.get('ref'),
    );

    if (!isCheckoutPlanId(planId)) return;

    if (codeFromQuery) {
      setDiscountCode(codeFromQuery);
    }

    // Set initializing state
    setInitUpgrade(true);

    const tryUpgrade = () => {
        console.log("Attempting upgrade...", {
            planId,
            interval,
            codeFromQuery,
            currencyLoading,
            actionLoading,
            currentSubscriptionLoaded: !!currentSubscription,
            currentPlan: currentSubscription?.planId
        });

        if (!actionLoading && !currencyLoading) {
            // Check if already on plan (only if we have subscription data)
            if (currentSubscription && currentSubscription.planId === planId) {
                console.log("Already on this plan.");
                setInitUpgrade(false);
                showAlert("You are already subscribed to this plan.", "Already Subscribed");
                // Remove params
                router.replace('/billing');
                return;
            }
            
            console.log("Triggering upgrade flow...");
            handleUpgrade(planId, interval, codeFromQuery || undefined);
        }
    }

    tryUpgrade();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, currentSubscription, currencyLoading]); // Monitor these changes


  const handleCancelSubscription = async () => {
    if (!currentSubscription || currentSubscription.cancelAtPeriodEnd) return;
    setActionLoading('cancel');
    try {
      await dispatch(cancelSubscription()).unwrap();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription || !currentSubscription.cancelAtPeriodEnd) return;
    setActionLoading('reactivate');
    try {
      await dispatch(reactivateSubscription()).unwrap();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading('portal');
    try {
      // For Razorpay, we might not have a portal, but keeping for legacy or if implemented
      // If Razorpay, usually management is via their email or custom flow.
      showAlert(
        "Please contact support to manage payment methods directly for now, or start a new subscription to update card.",
        "Manage Billing"
      );
    } catch (error) {
      console.error('Failed to manage billing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const resolveCheckoutTarget = (): { planId: CheckoutPlanId; period: BillingPeriod } => {
    const queryPlan = searchParams.get('plan');
    const queryPeriod = searchParams.get('interval');
    const period: BillingPeriod = queryPeriod === 'yearly' ? 'yearly' : 'monthly';

    if (isCheckoutPlanId(queryPlan)) {
      return { planId: queryPlan, period };
    }

    if ((effectivePlanId || 'free') === 'free') {
      return { planId: 'essential', period: 'monthly' };
    }

    return { planId: 'premium', period: 'monthly' };
  };

  const handleValidateDiscount = async () => {
    const normalizedCode = normalizeDiscountCode(discountCode);
    if (!normalizedCode) {
      setDiscountPreview(null);
      setDiscountError(null);
      return;
    }

    setDiscountLoading(true);
    setDiscountError(null);
    try {
      const target = resolveCheckoutTarget();
      const preview = await pricingApi.previewDiscount(
        target.planId,
        target.period,
        normalizedCode,
        currency.code,
      );
      setDiscountCode(preview.code);
      setDiscountPreview(preview);
      showAlert(preview.message, 'Discount Applied');
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to validate discount code.';
      setDiscountPreview(null);
      setDiscountError(message);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleUpgrade = async (
    planId: CheckoutPlanId,
    period: BillingPeriod,
    overrideDiscountCode?: string,
  ) => {
      setActionLoading('upgrade');
      setInitUpgrade(false); // Stop init loading, switch to action loading
      setDiscountError(null);

      try {
          const razorpayLoaded = window.Razorpay
            ? true
            : await loadRazorpayScript();
          if (!razorpayLoaded || !window.Razorpay) {
              showAlert("Razorpay SDK failed to load. Please refresh.", "Payment Error");
              setActionLoading(null);
              return;
          }

          const normalizedCode = normalizeDiscountCode(
            overrideDiscountCode || discountCode,
          );
          console.log("Calling API createRazorpaySubscription...");
          const data = await pricingApi.createRazorpaySubscription(
            planId,
            period,
            currency.code,
            normalizedCode || undefined,
          );
          console.log("Subscription created, opening Razorpay...", data);

          if (data.appliedDiscount) {
            const normalizedPreview: DiscountPreview = {
              valid: true,
              code: data.appliedDiscount.code,
              codeType: data.appliedDiscount.codeType,
              discountType: 'flat',
              discountValue: data.appliedDiscount.discountAmountMinor,
              baseAmountMinor: data.baseAmountMinor,
              discountAmountMinor: data.appliedDiscount.discountAmountMinor,
              payableAmountMinor: data.appliedDiscount.payableAmountMinor,
              currency: (data.currency as 'INR' | 'USD') || currency.code,
              planId,
              period,
              message: `${data.appliedDiscount.code} applied.`,
            };
            setDiscountPreview(normalizedPreview);
            setDiscountCode(data.appliedDiscount.code);
          }

          const options = {
              key: data.key,
              amount: 0, // Subscription auth amount usually, or formatted
              currency: data.currency,
              name: "TradeTaper",
              description: data.description,
              subscription_id: data.subscriptionId,
              handler: async function (response: any) {
                  console.log("Payment successful", response);
                  // Track revenue conversion in DataFast — currency-aware
                  if (response.razorpay_payment_id) {
                    const trackAmount = data.amount ?? getPlanPrice(planId, period, currency.code);
                    trackDatafastPayment({
                      amount: trackAmount,
                      currency: data.currency || currency.code,
                      transactionId: response.razorpay_payment_id,
                    });
                  }
                  setActionLoading(null);
                  router.push('/dashboard?payment_success=true');
                  // dispatch(fetchCurrentSubscription()); // Refresh state
              },
              modal: {
                  ondismiss: function() {
                      console.log("Payment modal dismissed");
                      setActionLoading(null);
                  }
              },
              theme: {
                  color: "#10B981"
              }
          };

          const rzp1 = new window.Razorpay(options);
          rzp1.open();
      } catch (error: any) {
          console.error("Upgrade failed:", error);
          const errorMessage = error?.response?.data?.message || error?.message || "Failed to initiate upgrade. Please try again.";
          showAlert(`Upgrade Error: ${errorMessage}`, "Upgrade Failed");
          setActionLoading(null);
      }
  };

  const effectivePlanId = currentSubscription?.planId || authUser?.subscription?.plan || 'free';
  const effectiveStatus = currentSubscription?.status || authUser?.subscription?.status || 'active';
  const billingPeriod: 'monthly' | 'yearly' =
    currentSubscription?.interval === 'year' ? 'yearly' : 'monthly';
  const planName =
    PRICING_TIERS.find((t) => t.id === effectivePlanId)?.name ||
    effectivePlanId ||
    'Free';
  const nextPaymentAmount = formatPlanPrice(effectivePlanId, billingPeriod, currency.code);

  const isPremium = effectivePlanId === 'premium';
  const currentTier = PRICING_TIERS.find((tier) => tier.id === effectivePlanId) ?? PRICING_TIERS[0];
  const upgradePreview = getUpgradePreviewForPlan(effectivePlanId, 5);

  const getUsagePercent = (used: number, limit: number) =>
    Math.min(limit > 0 ? (used / limit) * 100 : 0, 100);

  const tradeUsagePercent = usage ? getUsagePercent(usage.currentPeriodTrades, usage.tradeLimit) : 0;
  const syncUsagePercent = usage ? getUsagePercent(usage.accountsUsed, usage.accountLimit) : 0;
  const tradeLimitLabel = usage ? (usage.tradeLimit === 0 ? 'Unlimited' : `${usage.tradeLimit}`) : '...';
  const syncLimitLabel = usage ? `${usage.accountLimit}` : '...';

  useEffect(() => {
    if (!upgradePreview) {
      return;
    }
    const key = `${effectivePlanId}->${upgradePreview.toPlanId}`;
    if (unlockViewedKeyRef.current === key) {
      return;
    }
    emitBillingEvent('upgrade_unlocks_viewed', {
      surface: 'billing',
      from_plan: effectivePlanId,
      to_plan: upgradePreview.toPlanId,
      unlock_count: upgradePreview.highlights.length,
    });
    unlockViewedKeyRef.current = key;
  }, [effectivePlanId, upgradePreview]);

  const handleUpgradeUnlockCtaClick = () => {
    if (!upgradePreview) {
      return;
    }
    emitBillingEvent('upgrade_unlocks_cta_clicked', {
      surface: 'billing',
      from_plan: effectivePlanId,
      to_plan: upgradePreview.toPlanId,
      billing_period: billingPeriod,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 p-4 md:p-8 font-sans">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-emerald-500/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Loading Overlay */}
        {(actionLoading === 'upgrade' || initUpgrade) && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center flex-col">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Initializing Payment</h3>
                <p className="text-muted-foreground">Please wait while we connect to Razorpay secure gateway...</p>
            </div>
        )}

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <FaCreditCard className="text-white text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">
                            Billing & Plans
                        </h1>
                        <p className="text-muted-foreground font-medium">Manage your subscription and usage</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Subscription Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 shadow-sm">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                         
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-foreground mb-1">Current Plan</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 capitalize">
                                        {planName}
                                    </span>
                                    {effectiveStatus === 'active' && (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                                            <FaCheckCircle /> ACTIVE
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-muted-foreground text-sm mb-1">Next Payment</p>
                                <p className="text-xl font-bold text-foreground">
                                    {nextPaymentAmount}
                                    {effectivePlanId !== 'free' && (
                                      <span className="ml-1 text-sm text-muted-foreground">
                                        /{billingPeriod === 'yearly' ? 'yr' : 'mo'}
                                      </span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    on {currentSubscription ? formatDate(currentSubscription.currentPeriodEnd) : 'N/A'}
                                </p>
                            </div>
                         </div>

                         {/* Subscription Dates */}
                         <div className="bg-secondary/50 rounded-2xl p-6 border border-border mb-8 relative z-10">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-2">Billing Period</p>
                                    <p className="text-foreground font-medium flex items-center gap-2">
                                        <FaHistory className="text-muted-foreground" />
                                        {currentSubscription ? `${formatDate(currentSubscription.currentPeriodStart)} - ${formatDate(currentSubscription.currentPeriodEnd)}` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-2">Renews On</p>
                                    <p className="text-foreground font-medium flex items-center gap-2">
                                        <FaBolt className="text-amber-500" />
                                        {currentSubscription ? formatDate(currentSubscription.currentPeriodEnd) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                         </div>

                         {/* Actions */}
                         <div className="flex flex-wrap gap-4 relative z-10">
                             <Link href="/pricing" className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                <FaCrown /> Upgrade Plan
                             </Link>
                             
                             <button 
                                onClick={handleManageBilling}
                                disabled={actionLoading === 'portal'}
                                className="px-6 py-3 rounded-xl bg-secondary border border-border hover:bg-secondary/80 text-foreground font-medium transition-all flex items-center gap-2"
                             >
                                {actionLoading === 'portal' ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
                                Manage Payment Method
                             </button>

                             {currentSubscription?.cancelAtPeriodEnd ? (
                                <button 
                                    onClick={handleReactivateSubscription}
                                    disabled={actionLoading === 'reactivate'}
                                    className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 font-medium transition-all flex items-center gap-2 ml-auto"
                                >
                                    {actionLoading === 'reactivate' ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                    Reactivate
                                </button>
                             ) : (
                                <button 
                                    onClick={handleCancelSubscription}
                                    disabled={actionLoading === 'cancel'}
                                    className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-medium transition-all flex items-center gap-2 ml-auto"
                                >
                                    {actionLoading === 'cancel' ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                    Cancel
                                </button>
                             )}
                         </div>

                         <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                              <p className="text-sm font-semibold text-foreground">Discount / Referral Code</p>
                              <p className="text-xs text-muted-foreground">
                                Billing currency: {currency.code}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <input
                                value={discountCode}
                                onChange={(e) => {
                                  setDiscountCode(normalizeDiscountCode(e.target.value));
                                  setDiscountPreview(null);
                                  setDiscountError(null);
                                }}
                                placeholder="Enter coupon or referral code"
                                className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                              />
                              <button
                                type="button"
                                onClick={handleValidateDiscount}
                                disabled={discountLoading || actionLoading === 'upgrade'}
                                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-60"
                              >
                                {discountLoading ? 'Checking...' : 'Apply Code'}
                              </button>
                            </div>

                            {discountPreview && (
                              <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                                {discountPreview.codeType === 'referral' ? 'Referral' : 'Coupon'} {discountPreview.code} applied. You save {(discountPreview.discountAmountMinor / 100).toFixed(2)} {discountPreview.currency}.
                              </p>
                            )}
                            {discountError && (
                              <p className="mt-3 text-xs text-red-500">{discountError}</p>
                            )}
                         </div>
                    </div>

                    {/* Billing History */}
                    <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground">Billing History</h3>
                            <button className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                                <FaDownload /> Download All
                            </button>
                        </div>
                        
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                             <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                                <FaHistory className="text-2xl" />
                             </div>
                             <p className="text-muted-foreground font-medium">No invoices found for this period.</p>
                             <p className="text-muted-foreground text-sm mt-1">Previous billing cycles will appear here.</p>
                        </div>
                    </div>
                </div>

                {/* Usage Stats (Side Panel) */}
                <div className="space-y-8">
                    <div className="rounded-3xl border border-border bg-card/50 backdrop-blur-xl p-6 pt-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <FaChartBar className="text-xl" />
                             </div>
                             <h3 className="text-xl font-bold text-foreground">Monthly Usage</h3>
                        </div>

                        {usage ? (
                            <div className="space-y-6">
                                {/* Trades */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Trades</span>
                                        <span className="text-foreground font-medium">{usage.currentPeriodTrades} / {tradeLimitLabel}</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${tradeUsagePercent}%` }}
                                        ></div>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {usage.tradeLimit === 0
                                        ? 'Unlimited trade logging on this plan.'
                                        : `${Math.round(tradeUsagePercent)}% of monthly trade limit used.`}
                                    </p>
                                </div>

                                {/* MT5 Sync Slots */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">MT5 Auto-sync Slots</span>
                                        <span className="text-foreground font-medium">{usage.accountsUsed} / {syncLimitLabel}</span>
                                    </div>
                                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500/80 rounded-full transition-all duration-500"
                                            style={{ width: `${syncUsagePercent}%` }}
                                        ></div>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {usage.accountLimit === 0
                                        ? 'Auto-sync is disabled on Free. Manual/import accounts remain available.'
                                        : `${Math.round(syncUsagePercent)}% of MT5 sync slots used.`}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FaSpinner className="animate-spin mx-auto mb-2" />
                                <p>Loading usage data...</p>
                            </div>
                        )}

                        <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
                          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-3">Plan Entitlements</p>
                          <ul className="space-y-2">
                            {currentTier.features.slice(0, 4).map((feature) => (
                              <li key={feature} className="text-xs text-foreground/90">
                                - {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {!isPremium && upgradePreview && (
                            <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                              <p className="text-xs uppercase tracking-[0.12em] text-emerald-500 mb-2">What unlocks on upgrade</p>
                              <p className="text-sm font-semibold text-foreground mb-3">
                                Upgrade to {upgradePreview.toPlanName}
                              </p>
                              <ul className="space-y-2">
                                {upgradePreview.highlights.map((item) => (
                                  <li key={item} className="text-xs text-foreground/90">
                                    - {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                        )}

                        {!isPremium && upgradePreview && (
                            <div className="mt-8 pt-6 border-t border-border">
                                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-5 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                                    <h4 className="font-bold mb-1 relative z-10 flex items-center gap-2">
                                        <FaShieldAlt /> Unlock {upgradePreview.toPlanName}
                                    </h4>
                                    <p className="text-emerald-100 text-xs mb-3 relative z-10">
                                      Move from {planName} to {upgradePreview.toPlanName} and activate the listed features instantly.
                                    </p>
                                    <Link
                                      href="/pricing"
                                      onClick={handleUpgradeUnlockCtaClick}
                                      className="block w-full py-2 bg-white text-emerald-700 font-bold text-xs text-center rounded-lg hover:bg-emerald-50 transition-colors relative z-10"
                                    >
                                        Upgrade Now
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
      />
    </div>
  );
}
