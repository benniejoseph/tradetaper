"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { PRICING_TIERS } from '@/config/pricing';
import { FaCheck, FaTimes, FaQuestionCircle, FaStar, FaCrown } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const currentPlanId = user?.subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30 font-sans">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-teal-500/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto">
         <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            TradeTaper
         </Link>
         <div className="space-x-4 flex items-center">
            {isAuthenticated ? (
               <Link href="/dashboard" className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium">
                  Go to Dashboard
               </Link>
            ) : (
               <>
                 <Link href="/login" className="text-slate-400 hover:text-white transition-colors">Log In</Link>
                 <Link href="/register" className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                    Get Started
                 </Link>
               </>
            )}
         </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 text-center max-w-4xl mx-auto px-6 z-10">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Invest in Your <span className="text-gradient-emerald">Edge</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10">
          Choose the plan that fits your trading journey. Transparent pricing, no hidden fees.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center p-1 bg-slate-900 border border-white/5 rounded-full mb-16">
          <button 
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center ${billingPeriod === 'yearly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Yearly <span className="ml-2 text-xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PRICING_TIERS.map((tier) => {
            const isCurrentPlan = currentPlanId === tier.id;
            return (
              <div 
                key={tier.id}
                className={`relative rounded-3xl p-8 border backdrop-blur-xl transition-all duration-300 group
                  ${tier.recommended || isCurrentPlan
                    ? 'bg-slate-900/60 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10' 
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10 hover:bg-slate-900/50'
                  }`}
              >
                {(tier.recommended || isCurrentPlan) && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                     <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                       {isCurrentPlan ? (
                         <><FaCheck className="text-white" /> Current Plan</>
                       ) : (
                         <><FaCrown className="text-yellow-300" /> Recommended</>
                       )}
                     </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">
                      ${billingPeriod === 'monthly' ? tier.price : Math.floor(tier.price * 10)}
                    </span>
                    <span className="text-slate-500 ml-1 text-sm">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-4">{tier.description || "Perfect for getting started"}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start">
                      {feature.startsWith('No ') || feature.startsWith('Restriction') ? (
                         <FaTimes className="text-slate-600 mt-1 mr-3 text-xs flex-shrink-0" />
                      ) : (
                         <FaCheck className="text-emerald-400 mt-1 mr-3 text-xs flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.startsWith('No ') ? 'text-slate-600' : 'text-slate-300'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Button Action */}
                {isCurrentPlan ? (
                  <button 
                    disabled
                    className="block w-full py-4 rounded-xl text-center font-bold transition-all bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <Link 
                    href={isAuthenticated ? `/billing?plan=${tier.id}&interval=${billingPeriod}` : `/register?plan=${tier.id}`}
                    className={`block w-full py-4 rounded-xl text-center font-bold transition-all ${
                      tier.recommended
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                    }`}
                  >
                    {tier.price === 0 ? (isAuthenticated ? 'Downgrade' : 'Start Free') : (isAuthenticated ? 'Switch Plan' : 'Get Started')}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 pb-32 relative z-10">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period." },
            { q: "What stats do I get in the Free plan?", a: "The Free plan includes basic journaling stats (win rate, profit factor) and access to the economic calendar. Advanced AI insights are reserved for paid tiers." },
             { q: "Is my data secure?", a: "Absolutely. We use bank-grade encryption for all data transmission and storage. Your trading data is private and never shared." },
             { q: "Do you support crypto?", a: "Yes! TradeTaper works for Stocks, Forex, Crypto, and Futures markets." }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FaQuestionCircle className="text-emerald-500" /> {item.q}
              </h3>
              <p className="text-slate-400 pl-7">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-slate-500 text-sm relative z-10 bg-slate-950">
        <p>&copy; {new Date().getFullYear()} TradeTaper. All rights reserved.</p>
      </footer>
    </div>
  );
}
