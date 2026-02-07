"use client";
import React, { useState, useEffect } from 'react';

import PricingCard from '@/components/pricing/PricingCard';
import { PRICING_TIERS, PRICING_TIERS_ANNUAL, getDiscountPercentage } from '@/config/pricing';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { selectCurrentSubscription, fetchCurrentSubscription } from '@/store/features/subscriptionSlice';
import { FaCreditCard, FaLock, FaHeadset, FaCheck } from 'react-icons/fa';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const dispatch = useDispatch<AppDispatch>();
  const currentSubscription = useSelector(selectCurrentSubscription);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, isAuthenticated]);

  const currentTiers = billingInterval === 'month' ? PRICING_TIERS : PRICING_TIERS_ANNUAL;
  const discountPercentage = getDiscountPercentage(19.99, 199.99); // Professional tier discount

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-green-600/10 backdrop-blur-3xl"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm px-4 py-2 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
                <FaCreditCard className="w-4 h-4" />
                <span>Simple, transparent pricing</span>
              </div>
              
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Choose Your Trading Plan
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-12">
                Start with our free plan and upgrade as your trading grows. All plans include our core journaling features.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center space-x-4 mb-16">
                <span className={`text-sm font-medium ${billingInterval === 'month' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    billingInterval === 'year' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                      billingInterval === 'year' ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${billingInterval === 'year' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    Yearly
                  </span>
                  {billingInterval === 'year' && (
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                      Save {discountPercentage}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {currentTiers.map((tier) => (
              <PricingCard
                key={tier.id}
                tier={tier}
                isPopular={tier.recommended}
                currentTier={currentSubscription?.currentPlan}
              />
            ))}
          </div>
        </div>

        {/* Features Comparison */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Compare Plans
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/50 dark:border-gray-700/50">
                    <th className="text-left py-4 px-4 text-gray-600 dark:text-gray-400 font-medium">Features</th>
                    {currentTiers.map((tier) => (
                      <th key={tier.id} className="text-center py-4 px-4">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{tier.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {tier.price === 0 ? 'Free' : `$${tier.price}/${tier.interval}`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  <tr>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Trades per month</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">10</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">100</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">500</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Trading accounts</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">1</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">3</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">10</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Advanced analytics</td>
                    <td className="py-4 px-4 text-center">❌</td>
                    <td className="py-4 px-4 text-center text-green-500"><FaCheck /></td>
                    <td className="py-4 px-4 text-center text-green-500"><FaCheck /></td>
                    <td className="py-4 px-4 text-center text-green-500"><FaCheck /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">API Access</td>
                    <td className="py-4 px-4 text-center">❌</td>
                    <td className="py-4 px-4 text-center">❌</td>
                    <td className="py-4 px-4 text-center text-green-500"><FaCheck /></td>
                    <td className="py-4 px-4 text-center text-green-500"><FaCheck /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Team collaboration</td>
                    <td className="py-4 px-4 text-center">❌</td>
                    <td className="py-4 px-4 text-center">❌</td>
                    <td className="py-4 px-4 text-center">❌</td>
                    <td className="py-4 px-4 text-center text-green-500"><FaCheck /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">Support</td>
                    <td className="py-4 px-4 text-center text-gray-600 dark:text-gray-400">Community</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Email</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Priority Email</td>
                    <td className="py-4 px-4 text-center text-gray-900 dark:text-white">Phone + Email</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100/80 dark:bg-blue-900/30 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaLock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-400">Your trading data is encrypted and secure. We never share your information.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaHeadset className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-400">Get help when you need it with our responsive customer support team.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100/80 dark:bg-purple-900/30 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaCreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cancel Anytime</h3>
              <p className="text-gray-600 dark:text-gray-400">No long-term contracts. Cancel your subscription at any time.</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Can I change my plan at any time?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate the billing.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We accept major credit cards (Visa, MasterCard, American Express) and PayPal through our secure Razorpay payment processor.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Our Free plan lets you get started with up to 10 trades per month. No credit card required to start!
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We offer a 30-day money-back guarantee on all paid plans. If you&apos;re not satisfied, contact us for a full refund.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 