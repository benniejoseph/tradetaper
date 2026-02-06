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
import { PRICING_TIERS, PRICING_TIERS_ANNUAL } from '@/config/pricing';
import { 
  FaCreditCard, 
  FaHistory, 
  FaChartBar, 
  FaExclamationTriangle, 
  FaCheckCircle,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaDownload
} from 'react-icons/fa';
import { format } from 'date-fns';
import Link from 'next/link';

export default function BillingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const currentSubscription = useSelector(selectCurrentSubscription);
  const billingInfo = useSelector(selectBillingInfo);
  const usage = useSelector(selectUsage);
  const isLoading = useSelector(selectSubscriptionLoading);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchBillingInfo());
    dispatch(fetchUsage());
  }, [dispatch]);

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
      const { url } = await pricingApi.createPortalSession(window.location.href);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create portal session:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getCurrentTier = () => {
    if (!currentSubscription) return null;
    const allTiers = [...PRICING_TIERS, ...PRICING_TIERS_ANNUAL];
    return allTiers.find(tier => tier.stripePriceId === currentSubscription.stripePriceId);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const currentTier = getCurrentTier();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-24">
            <FaSpinner className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl">
              <FaCreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Subscription</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your subscription and billing settings</p>
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Current Plan</h2>
          
          {currentSubscription ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${currentTier?.recommended ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <FaCheckCircle className={`w-6 h-6 ${currentTier?.recommended ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {currentTier?.name || 'Unknown Plan'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      ${currentTier?.price || 0}/{currentTier?.interval || 'month'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1.5 text-sm font-semibold rounded-xl ${
                    currentSubscription.status === 'active' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Period</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(new Date(currentSubscription.currentPeriodStart), 'MMM dd')} - {format(new Date(currentSubscription.currentPeriodEnd), 'MMM dd, yyyy')}
                  </p>
                </div>

                {billingInfo?.upcomingInvoice && (
                  <div className="bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Next Payment</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${billingInfo.upcomingInvoice.amount} on {format(new Date(billingInfo.upcomingInvoice.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {currentSubscription.cancelAtPeriodEnd && (
                <div className="bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <FaExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Subscription Scheduled for Cancellation</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        Your subscription will end on {format(new Date(currentSubscription.currentPeriodEnd), 'MMM dd, yyyy')}. 
                        You&apos;ll continue to have access until then.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/plans"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Change Plan</span>
                </Link>

                <button
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'portal' ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCreditCard className="w-4 h-4" />}
                  <span>Manage Payment Methods</span>
                </button>

                {currentSubscription.cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading === 'reactivate'}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'reactivate' ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                    <span>Reactivate Subscription</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading === 'cancel'}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'cancel' ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaTimes className="w-4 h-4" />}
                    <span>Cancel Subscription</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FaExclamationTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Active Subscription</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You&apos;re currently on the free plan. Upgrade to unlock premium features.
              </p>
              <Link
                href="/plans"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <FaCreditCard className="w-4 h-4" />
                <span>View Plans</span>
              </Link>
            </div>
          )}
        </div>

        {/* Usage Statistics */}
        {usage && (
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl">
                <FaChartBar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usage This Period</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trades</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.currentPeriodTrades} / {usage.tradeLimit === 0 ? '∞' : usage.tradeLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      getUsagePercentage(usage.currentPeriodTrades, usage.tradeLimit) >= 90 
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : getUsagePercentage(usage.currentPeriodTrades, usage.tradeLimit) >= 75
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${usage.tradeLimit === 0 ? 0 : getUsagePercentage(usage.currentPeriodTrades, usage.tradeLimit)}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Accounts</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {usage.accountsUsed} / {usage.accountLimit === 0 ? '∞' : usage.accountLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      getUsagePercentage(usage.accountsUsed, usage.accountLimit) >= 90 
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : getUsagePercentage(usage.accountsUsed, usage.accountLimit) >= 75
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                        : 'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                    style={{ width: `${usage.accountLimit === 0 ? 0 : getUsagePercentage(usage.accountsUsed, usage.accountLimit)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl">
                <FaHistory className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Billing History</h2>
            </div>
            <button className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <FaDownload className="w-4 h-4" />
              <span>Download All</span>
            </button>
          </div>

          <div className="text-center py-12">
            <FaHistory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Billing history will appear here once you have transactions.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              You can also access detailed invoices through the billing portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 