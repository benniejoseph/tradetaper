"use client";

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { 
  selectCurrentSubscription, 
  selectBillingInfo, 
  selectUsage,
  selectSubscriptionLoading,
  fetchBillingInfo,
  fetchUsage,
  cancelSubscription,
  reactivateSubscription 
} from '@/store/features/subscriptionSlice';
import { pricingApi } from '@/services/pricingApi';
import { PRICING_TIERS } from '@/config/pricing';
import { 
  FaCreditCard, 
  FaHistory, 
  FaChartBar, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaDownload,
  FaCrown,
  FaShieldAlt,
  FaBolt
} from 'react-icons/fa';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return 'N/A';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, 'MMM dd, yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
};

export default function BillingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSubscription = useSelector(selectCurrentSubscription);
  const billingInfo = useSelector(selectBillingInfo);
  const usage = useSelector(selectUsage);
  const isLoading = useSelector(selectSubscriptionLoading);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // Load Razorpay Script
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [initUpgrade, setInitUpgrade] = useState(false);

  useEffect(() => {
    const loadRazorpayScript = () => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            setIsRazorpayLoaded(true);
            console.log("Razorpay SDK loaded.");
        };
        script.onerror = () => {
            console.error("Failed to load Razorpay SDK.");
            setIsRazorpayLoaded(false);
        };
        document.body.appendChild(script);
    };

    if (!window.Razorpay) {
        loadRazorpayScript();
    } else {
        setIsRazorpayLoaded(true);
    }
  }, []);

  useEffect(() => {
    dispatch(fetchBillingInfo());
    dispatch(fetchUsage());
  }, [dispatch]);

  // Handle URL Query Params for Upgrade
  useEffect(() => {
    const planId = searchParams.get('plan');
    const interval = searchParams.get('interval') as 'monthly' | 'yearly' || 'monthly';

    if (!planId) return;

    // Set initializing state
    setInitUpgrade(true);

    const tryUpgrade = () => {
        console.log("Attempting upgrade...", {
            planId,
            isRazorpayLoaded,
            actionLoading,
            currentSubscriptionLoaded: !!currentSubscription,
            currentPlan: currentSubscription?.planId
        });

        if (isRazorpayLoaded && !actionLoading && currentSubscription) {
            // Check if already on plan
            if (currentSubscription.planId === planId) {
                console.log("Already on this plan.");
                setInitUpgrade(false);
                alert("You are already subscribed to this plan.");
                // Remove params
                router.replace('/billing');
                return;
            }

            console.log("Triggering upgrade flow...");
            handleUpgrade(planId, interval);
        } else {
             console.log("Waiting for dependencies...");
        }
    }

    tryUpgrade();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isRazorpayLoaded, currentSubscription]); // Monitor these changes


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
      alert("Please contact support to manage payment methods directly for now, or start a new subscription to update card.");
    } catch (error) {
      console.error('Failed to manage billing:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpgrade = async (planId: string, period: 'monthly' | 'yearly') => {
      setActionLoading('upgrade');
      setInitUpgrade(false); // Stop init loading, switch to action loading

      try {
          console.log("Calling API createRazorpaySubscription...");
          const data = await pricingApi.createRazorpaySubscription(planId, period);
          console.log("Subscription created, opening Razorpay...", data);

          if (!window.Razorpay) {
              alert("Razorpay SDK failed to load. Please refresh.");
              setActionLoading(null);
              return;
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
                  setActionLoading(null);
                  router.push('/dashboard?payment_success=true');
                  dispatch(fetchCurrentSubscription()); // Refresh state
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
      } catch (error) {
          console.error("Upgrade failed:", error);
          alert("Failed to initiate upgrade. Please try again.");
          setActionLoading(null);
      }
  };

  // Helper to determine plan name safely
  const planName = currentSubscription?.planId
    ? (PRICING_TIERS.find(t => t.id === currentSubscription.planId)?.name || currentSubscription.planId)
    : 'Free';

  const isPremium = planName.toLowerCase() === 'premium';

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 p-4 md:p-8 font-sans">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <FaCreditCard className="text-white text-2xl" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Billing & Plans
                        </h1>
                        <p className="text-slate-400 font-medium">Manage your subscription and usage</p>
                    </div>
                </div>

                <Link href="/pricing" className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all font-medium text-emerald-400">
                    <FaCrown /> View All Plans
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Subscription Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="relative overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 shadow-2xl">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                         
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Current Plan</h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 capitalize">
                                        {planName}
                                    </span>
                                    {currentSubscription?.status === 'active' && (
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                                            <FaCheckCircle /> ACTIVE
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <p className="text-slate-400 text-sm mb-1">Next Payment</p>
                                <p className="text-xl font-bold text-white">
                                    {billingInfo?.upcomingInvoice ? `$${billingInfo.upcomingInvoice.amount/100}` : '$0.00'}
                                </p>
                                <p className="text-xs text-slate-500">
                                    on {billingInfo?.upcomingInvoice ? formatDate(billingInfo.upcomingInvoice.date) : 'N/A'}
                                </p>
                            </div>
                         </div>

                         {/* Subscription Dates */}
                         <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800 mb-8 relative z-10">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-2">Billing Period</p>
                                    <p className="text-white font-medium flex items-center gap-2">
                                        <FaHistory className="text-slate-600" />
                                        {currentSubscription ? `${formatDate(currentSubscription.currentPeriodStart)} - ${formatDate(currentSubscription.currentPeriodEnd)}` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-2">Renews On</p>
                                    <p className="text-white font-medium flex items-center gap-2">
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
                                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium transition-all flex items-center gap-2"
                             >
                                {actionLoading === 'portal' ? <FaSpinner className="animate-spin" /> : <FaCreditCard />}
                                Manage Payment Method
                             </button>

                             {currentSubscription?.cancelAtPeriodEnd ? (
                                <button 
                                    onClick={handleReactivateSubscription}
                                    disabled={actionLoading === 'reactivate'}
                                    className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-medium transition-all flex items-center gap-2 ml-auto"
                                >
                                    {actionLoading === 'reactivate' ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                    Reactivate
                                </button>
                             ) : (
                                <button 
                                    onClick={handleCancelSubscription}
                                    disabled={actionLoading === 'cancel'}
                                    className="px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-medium transition-all flex items-center gap-2 ml-auto"
                                >
                                    {actionLoading === 'cancel' ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                                    Cancel
                                </button>
                             )}
                         </div>
                    </div>

                    {/* Billing History */}
                    <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">Billing History</h3>
                            <button className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1">
                                <FaDownload /> Download All
                            </button>
                        </div>
                        
                        <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
                             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                                <FaHistory className="text-2xl" />
                             </div>
                             <p className="text-slate-400 font-medium">No invoices found for this period.</p>
                             <p className="text-slate-600 text-sm mt-1">Previous billing cycles will appear here.</p>
                        </div>
                    </div>
                </div>

                {/* Usage Stats (Side Panel) */}
                <div className="space-y-8">
                    <div className="rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 pt-8">
                        <div className="flex items-center gap-3 mb-6">
                             <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                                <FaChartBar className="text-xl" />
                             </div>
                             <h3 className="text-xl font-bold text-white">Monthly Usage</h3>
                        </div>

                        {usage ? (
                            <div className="space-y-6">
                                {/* Trades */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Trades</span>
                                        <span className="text-white font-medium">{usage.currentPeriodTrades} / {usage.tradeLimit === 0 ? '∞' : usage.tradeLimit}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((usage.tradeLimit > 0 ? (usage.currentPeriodTrades / usage.tradeLimit) * 100 : 0), 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Accounts */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">Accounts</span>
                                        <span className="text-white font-medium">{usage.accountsUsed} / {usage.accountLimit === 0 ? '∞' : usage.accountLimit}</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((usage.accountLimit > 0 ? (usage.accountsUsed / usage.accountLimit) * 100 : 0), 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <FaSpinner className="animate-spin mx-auto mb-2" />
                                <p>Loading usage data...</p>
                            </div>
                        )}

                        {!isPremium && (
                            <div className="mt-8 pt-6 border-t border-slate-800">
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-5 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none"></div>
                                    <h4 className="font-bold mb-1 relative z-10 flex items-center gap-2">
                                        <FaShieldAlt /> Go Premium
                                    </h4>
                                    <p className="text-indigo-100 text-xs mb-3 relative z-10">Get unlimited trades, AI analysis, and priority support.</p>
                                    <Link href="/pricing" className="block w-full py-2 bg-white text-indigo-700 font-bold text-xs text-center rounded-lg hover:bg-indigo-50 transition-colors relative z-10">
                                        Upgrade Now
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
} 