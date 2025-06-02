"use client";
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '@/store/store';
import { selectUsage, selectCurrentSubscription, fetchUsage } from '@/store/features/subscriptionSlice';
import { FaExclamationTriangle, FaCrown, FaArrowUp } from 'react-icons/fa';
import Link from 'next/link';

interface UsageLimitGuardProps {
  feature: 'trades' | 'accounts';
  children: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export default function UsageLimitGuard({ feature, children, showUpgradePrompt = true }: UsageLimitGuardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const usage = useSelector(selectUsage);
  const currentSubscription = useSelector(selectCurrentSubscription);

  useEffect(() => {
    if (!usage) {
      dispatch(fetchUsage());
    }
  }, [dispatch, usage]);

  // Don't block if we don't have usage data yet
  if (!usage) {
    return <>{children}</>;
  }

  const isTradesFeature = feature === 'trades';

  const currentUsage = isTradesFeature ? usage.currentPeriodTrades : usage.accountsUsed;
  const limit = isTradesFeature ? usage.tradeLimit : usage.accountLimit;
  
  // If limit is 0 (unlimited), always allow
  if (limit === 0) {
    return <>{children}</>;
  }

  const isAtLimit = currentUsage >= limit;
  const isNearLimit = currentUsage >= limit * 0.9; // 90% of limit

  // If at limit, show upgrade prompt instead of children
  if (isAtLimit && showUpgradePrompt) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-orange-200/50 dark:border-orange-800/50 rounded-2xl p-8 text-center shadow-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6">
          <FaExclamationTriangle className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {isTradesFeature ? 'Trade Limit Reached' : 'Account Limit Reached'}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          {isTradesFeature 
            ? `You&apos;ve reached your monthly limit of ${limit} trades. Upgrade your plan to log more trades.`
            : `You&apos;ve reached your limit of ${limit} trading accounts. Upgrade your plan to add more accounts.`
          }
        </p>

        <div className="space-y-4">
          <Link
            href="/pricing"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <FaCrown className="w-4 h-4" />
            <span>Upgrade Plan</span>
            <FaArrowUp className="w-4 h-4" />
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current plan: {currentSubscription?.tier?.name || 'Free'}
          </div>
        </div>
      </div>
    );
  }

  // If near limit, show warning but still render children
  return (
    <div className="space-y-4">
      {isNearLimit && showUpgradePrompt && (
        <div className="bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                {isTradesFeature ? 'Approaching Trade Limit' : 'Approaching Account Limit'}
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                You&apos;re using {currentUsage} of {limit} {isTradesFeature ? 'trades this month' : 'accounts'}. 
                Consider upgrading to avoid hitting your limit.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center space-x-1 text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200 font-medium mt-2"
              >
                <span>View plans</span>
                <FaArrowUp className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

// Hook for checking if user can perform an action
export const useCanPerformAction = (feature: 'trades' | 'accounts') => {
  const usage = useSelector(selectUsage);
  
  if (!usage) return true; // Allow if we don't have usage data yet

  const isTradesFeature = feature === 'trades';
  const currentUsage = isTradesFeature ? usage.currentPeriodTrades : usage.accountsUsed;
  const limit = isTradesFeature ? usage.tradeLimit : usage.accountLimit;
  
  // If limit is 0 (unlimited), always allow
  if (limit === 0) return true;
  
  return currentUsage < limit;
}; 