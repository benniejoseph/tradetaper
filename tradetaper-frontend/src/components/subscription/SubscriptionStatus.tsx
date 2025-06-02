"use client";
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { 
  selectCurrentSubscription, 
  selectUsage, 
  selectSubscriptionLoading,
  fetchCurrentSubscription,
  fetchUsage 
} from '@/store/features/subscriptionSlice';
import { FaCrown, FaChartBar, FaUsers, FaSpinner, FaArrowUp } from 'react-icons/fa';
import Link from 'next/link';

interface SubscriptionStatusProps {
  compact?: boolean;
}

export default function SubscriptionStatus({ compact = false }: SubscriptionStatusProps) {
  const dispatch = useDispatch<AppDispatch>();
  const currentSubscription = useSelector(selectCurrentSubscription);
  const usage = useSelector(selectUsage);
  const isLoading = useSelector(selectSubscriptionLoading);

  useEffect(() => {
    dispatch(fetchCurrentSubscription());
    dispatch(fetchUsage());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-center">
          <FaSpinner className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      </div>
    );
  }

  const isFreeTier = !currentSubscription || currentSubscription.tier.id === 'free';
  const isPremium = currentSubscription && currentSubscription.status === 'active';

  if (compact) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${isPremium ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <FaCrown className={`w-4 h-4 ${isPremium ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {currentSubscription?.tier.name || 'Free Plan'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {usage && usage.tradeLimit > 0 ? `${usage.currentPeriodTrades}/${usage.tradeLimit} trades` : 'Unlimited trades'}
              </p>
            </div>
          </div>
          
          {isFreeTier && (
            <Link
              href="/pricing"
              className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${isPremium ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <FaCrown className={`w-6 h-6 ${isPremium ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {currentSubscription?.tier.name || 'Free Plan'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isPremium ? 'Active subscription' : 'Upgrade to unlock premium features'}
            </p>
          </div>
        </div>

        <div className="text-right">
          {currentSubscription && currentSubscription.tier.price > 0 && (
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ${currentSubscription.tier.price}
              <span className="text-sm text-gray-500 dark:text-gray-400">/{currentSubscription.tier.interval}</span>
            </div>
          )}
        </div>
      </div>

      {usage && (
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FaChartBar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trades This Month</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {usage.currentPeriodTrades} / {usage.tradeLimit === 0 ? '∞' : usage.tradeLimit}
              </span>
            </div>
            {usage.tradeLimit > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((usage.currentPeriodTrades / usage.tradeLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-800/40 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FaUsers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trading Accounts</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {usage.accountsUsed} / {usage.accountLimit === 0 ? '∞' : usage.accountLimit}
              </span>
            </div>
            {usage.accountLimit > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((usage.accountsUsed / usage.accountLimit) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        {isFreeTier ? (
          <Link
            href="/pricing"
            className="flex-1 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <FaCrown className="w-4 h-4" />
            <span>Upgrade Plan</span>
            <FaArrowUp className="w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link
              href="/billing"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700/80"
            >
              Manage Billing
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Change Plan
            </Link>
          </>
        )}
      </div>
    </div>
  );
} 