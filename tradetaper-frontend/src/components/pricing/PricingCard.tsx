"use client";
import React, { useState } from 'react';
import { PricingTier } from '@/types/pricing';
import { FaCheck, FaStar, FaSpinner } from 'react-icons/fa';
import { getStripeInstance } from '@/lib/stripe';
import { pricingApi } from '@/services/pricingApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';

interface PricingCardProps {
  tier: PricingTier;
  isPopular?: boolean;
  currentTier?: string;
  onUpgrade?: (tierId: string) => void;
}

export default function PricingCard({ tier, isPopular = false, currentTier, onUpgrade }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const router = useRouter();

  const handleSelectPlan = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (tier.id === 'free') {
      // Free tier doesn't require payment
      onUpgrade?.(tier.id);
      return;
    }

    setIsLoading(true);
    try {
      const { sessionId } = await pricingApi.createCheckoutSession({
        priceId: tier.stripePriceId,
        successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      const stripe = await getStripeInstance();
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe error:', error);
        // Handle error appropriately
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentTier = currentTier === tier.id;
  const isFree = tier.id === 'free';

  return (
    <div className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 ${
      isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
    } ${isCurrentTier ? 'ring-2 ring-green-500' : ''}`}>
      
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-1 shadow-lg">
            <FaStar className="w-3 h-3" />
            <span>Most Popular</span>
          </div>
        </div>
      )}

      {/* Current Tier Badge */}
      {isCurrentTier && (
        <div className="absolute -top-4 right-4">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Current Plan
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {tier.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {tier.description}
        </p>
        
        {/* Price */}
        <div className="mb-6">
          {isFree ? (
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              Free
            </div>
          ) : (
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ${tier.price}
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">
                /{tier.interval}
              </span>
            </div>
          )}
          
          {/* Usage Limits */}
          {(tier.tradeLimit || tier.accountLimit) && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              {tier.tradeLimit && (
                <div>
                  {tier.tradeLimit === Infinity ? 'Unlimited' : tier.tradeLimit} trades/{tier.interval}
                </div>
              )}
              {tier.accountLimit && (
                <div>
                  {tier.accountLimit === Infinity ? 'Unlimited' : tier.accountLimit} accounts
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4 mb-8">
        {tier.features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-1">
              <FaCheck className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSelectPlan}
        disabled={isLoading || isCurrentTier}
        className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
          isCurrentTier
            ? 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : isPopular
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
            : isFree
            ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl hover:scale-105'
            : 'bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/80 shadow-lg hover:shadow-xl hover:scale-105'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : isCurrentTier ? (
          'Current Plan'
        ) : isFree ? (
          'Get Started Free'
        ) : (
          `Upgrade to ${tier.name}`
        )}
      </button>
    </div>
  );
} 