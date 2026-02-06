"use client";

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { billingService, PricingPlan, BillingInfo } from '@/services/billingService';
import PlanCard from '@/components/billing/PlanCard';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingPage() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [plansData, subData] = await Promise.all([
            billingService.getPricingPlans(),
            billingService.getCurrentSubscription().catch(() => null)
        ]);
        setPlans(plansData);
        setCurrentSub(subData);
    } catch (error) {
        console.error('Failed to load billing data', error);
        toast.error('Failed to load billing details');
    } finally {
        setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setProcessingId(planId);
    try {
        const order = await billingService.createRazorpaySubscription(planId, period);
        
        const options = {
            key: order.key,
            subscription_id: order.subscriptionId,
            name: order.name,
            description: order.description,
            currency: order.currency,
            customer_id: order.customer_id,
            handler: function (response: any) {
                // Payment Success
                toast.success('Subscription activated successfully!');
                // Reload data to reflect new status
                setTimeout(loadData, 2000); 
            },
            modal: {
                ondismiss: function() {
                    setProcessingId(null);
                }
            },
            theme: {
                color: "#10b981" // Emerald-500
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any){
             toast.error(response.error.description || 'Payment Failed');
             setProcessingId(null);
        });
        rzp.open();

    } catch (error) {
        console.error('Subscription init failed', error);
        toast.error('Failed to initialize payment');
        setProcessingId(null);
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Choose the plan that fits your trading journey.
        </p>

        {/* Period Toggle */}
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl items-center relative">
             <button 
                onClick={() => setPeriod('monthly')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === 'monthly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
                 Monthly
             </button>
             <button 
                onClick={() => setPeriod('yearly')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === 'yearly' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
                 Yearly <span className="text-emerald-500 text-xs ml-1 font-bold">-20%</span>
             </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            period={period}
            isPopular={plan.id === 'professional'}
            isCurrent={currentSub?.currentPlan === plan.id || (plan.id === 'starter' && isNaN(parseInt(currentSub?.currentPlan || '')) && (!currentSub?.currentPlan || currentSub.currentPlan === 'free'))}
            // Logic for 'isCurrent' is a bit hacky above, simpler:
            // isCurrent={currentSub?.currentPlan === plan.name} // assuming plan.name matches 'starter', etc.
            isLoading={processingId === plan.id}
            onUpgrade={() => handleUpgrade(plan.id)}
          />
        ))}
      </div>

      {/* Current Subscription Details */}
      {currentSub && currentSub.currentPlan !== 'free' && (
          <div className="mt-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Subscription Status</h2>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Current Plan</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{currentSub.currentPlan}</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                       <p className="text-gray-500 dark:text-gray-400 text-sm">Status</p>
                       <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${currentSub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                           {currentSub.status.toUpperCase()}
                       </span>
                  </div>
                  <div className="mt-4 sm:mt-0">
                       <p className="text-gray-500 dark:text-gray-400 text-sm">Renews On</p>
                       <p className="text-gray-900 dark:text-white font-medium">
                           {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                       </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
