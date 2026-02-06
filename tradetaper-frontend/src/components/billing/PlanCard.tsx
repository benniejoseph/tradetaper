"use client";
import React from 'react';
import { FaCheck, FaStar, FaSpinner, FaTimes } from 'react-icons/fa';

interface PlanCardProps {
  plan: any; // Using any for flexibility to match PricingPlan
  isPopular?: boolean;
  isCurrent?: boolean;
  onUpgrade?: () => void;
  isLoading?: boolean;
  period: 'monthly' | 'yearly';
}

export default function PlanCard({ 
    plan, 
    isPopular, 
    isCurrent, 
    onUpgrade, 
    isLoading,
    period 
}: PlanCardProps) {
  
  const price = period === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  // Assuming price is in cents/paisa, format it. Backend sent 2999 for $29.99.
  // Actually, for Razorpay/India, we might want ₹. But plans said $9.99.
  // I will assume $ for now or currency from plan if available.
  // Let's format as Currency.
  // Backend sent integer 2999.
  const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
  }).format(price / 100);

  return (
    <div className={`relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 shadow-lg transition-all duration-300 flex flex-col h-full ${
      isPopular ? 'ring-2 ring-emerald-500 scale-105 z-10' : 'hover:shadow-2xl'
    } ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
      
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
            Most Popular
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {plan.displayName || plan.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 h-10">
          {plan.description}
        </p>
      </div>
        
      {/* Price */}
      <div className="mb-6 text-center">
          <div className="flex items-baseline justify-center">
            <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
              {formattedPrice}
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
              /{period === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8 flex-grow">
        {plan.features.map((feature: string, index: number) => {
          const isNegative = feature.startsWith('No ') || feature.startsWith('Restriction');
          return (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {isNegative ? (
                   <FaTimes className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
                ) : (
                   <FaCheck className="w-3.5 h-3.5 text-emerald-500" />
                )}
              </div>
              <span className={`text-sm ${isNegative ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-300'}`}>
                {feature}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA Button */}
      <button
        onClick={onUpgrade}
        disabled={isLoading || isCurrent}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 ${
          isCurrent
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
            : isPopular
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <FaSpinner className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        ) : isCurrent ? (
          'Current Plan'
        ) : (
          plan.name === 'starter' ? 'Get Started' : 'Upgrade'
        )}
      </button>
    </div>
  );
}
