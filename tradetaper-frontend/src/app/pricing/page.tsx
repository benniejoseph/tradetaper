"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PRICING_TIERS } from '@/config/pricing';
import { FaCheck, FaTimes, FaQuestionCircle, FaStar, FaCrown } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  const currentPlanId = user?.subscription?.plan || 'free';

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans overflow-hidden">
      {/* Background Gradients & Effects */}
      <div className="fixed inset-0 pointer-events-none">
          {/* Top Center Glow */}
           <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
           {/* Bottom Right Glow */}
           <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[120px]"></div>
           
           {/* Huge 'Pricing' Text Background */}
           <div className="absolute top-20 left-1/2 -translate-x-1/2 font-black text-[12rem] md:text-[20rem] text-white/[0.02] tracking-tighter leading-none select-none z-0">
             Pricing
           </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 p-6 flex justify-between items-center max-w-7xl mx-auto">
         <Link href="/" className="flex items-center gap-3">
            <Image
              src="/tradetaperLogo.png"
              alt="TradeTaper"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              TradeTaper
            </span>
         </Link>
         <div className="space-x-4 flex items-center">
            {isAuthenticated ? (
               <Link href="/dashboard" className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-medium text-sm backdrop-blur-md">
                  Dashboard
               </Link>
            ) : (
               <>
                 <Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">Log In</Link>
                 <Link href="/register" className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-medium text-sm shadow-lg shadow-emerald-900/20">
                    Get Started
                 </Link>
               </>
            )}
         </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24">
        
        {/* Header */}
        <div className="text-center mb-16 relative">
             <h2 className="text-sm font-bold tracking-widest text-emerald-500 uppercase mb-3">Flexible Plans</h2>
             <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                Simple, transparent pricing
             </h1>
             <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                No hidden fees. Cancel anytime. Choose the plan that fits your trading style.
             </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {PRICING_TIERS.map((tier) => {
            const isCurrentPlan = currentPlanId === tier.id;
            const price = billingPeriod === 'monthly' ? tier.price : Math.floor(tier.price * 10); // Simple yearly calc
            
            return (
              <div 
                key={tier.id}
                className={`relative group rounded-[2rem] p-8 backdrop-blur-xl border transition-all duration-500 flex flex-col
                  ${tier.recommended 
                    ? 'bg-slate-900/60 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 z-10 scale-[1.02]' 
                    : 'bg-slate-900/50 border-white/5 hover:border-white/20 hover:bg-slate-900/60'
                  }`}
              >
                {/* Glow Effect on Hover */}
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div className="mb-8">
                    <h3 className="text-xl font-medium text-white mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 my-4">
                        <span className="text-5xl font-bold text-white tracking-tight">${price}</span>
                        <span className="text-lg text-slate-500 font-medium">{tier.price > 0 ? `/${billingPeriod === 'monthly' ? 'mo' : 'yr'}` : ''}</span>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed min-h-[40px]">
                        {tier.description}
                    </p>
                </div>

                <div className="space-y-4 mb-10 flex-grow">
                    {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${feature.startsWith('No ') ? 'bg-slate-800' : 'bg-emerald-500/20'}`}>
                                {feature.startsWith('No ') ? (
                                    <FaTimes className="text-[10px] text-slate-500" />
                                ) : (
                                    <FaCheck className="text-[10px] text-emerald-400" />
                                )}
                            </div>
                            <span className={`text-sm ${feature.startsWith('No ') ? 'text-slate-600' : 'text-slate-300'}`}>
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

                {isCurrentPlan ? (
                    <button disabled className="w-full py-3.5 rounded-full bg-slate-800 text-slate-400 font-semibold cursor-default border border-slate-700">
                        Current Plan
                    </button>
                ) : (
                    <Link 
                        href={isAuthenticated ? `/billing?plan=${tier.id}&interval=${billingPeriod}` : `/register?plan=${tier.id}`}
                        className={`w-full py-3.5 rounded-full font-bold text-center transition-all duration-300 transform group-hover:scale-[1.02] ${
                            tier.recommended 
                                ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5'
                        }`}
                    >
                        {isAuthenticated ? 'Choose Plan' : 'Get Started'}
                    </Link>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Toggle (Bottom Leftish or Centered as per image implication but better UX centered below or above) */}
        {/* The image had it bottom left. I'll put it centered below cards to match standard UX but styled like the image toggle */}
        <div className="mt-16 flex justify-center">
            <div className="flex items-center gap-4 p-1.5 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10">
                <button 
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${billingPeriod === 'monthly' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setBillingPeriod('yearly')}
                    className={`px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${billingPeriod === 'yearly' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Yearly
                </button>
            </div>
            {/* Discount Badge */}
            <div className="ml-4 flex items-center">
                 <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded">Save 20%</span>
            </div>
        </div>

      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-6 pb-32 relative z-10 mt-12 border-t border-white/5 pt-24">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          {[
            { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period." },
            { q: "What stats do I get in the Free plan?", a: "The Free plan includes basic journaling stats (win rate, profit factor) and access to the economic calendar. Advanced AI insights are reserved for paid tiers." },
             { q: "Is my data secure?", a: "Absolutely. We use bank-grade encryption for all data transmission and storage. Your trading data is private and never shared." },
             { q: "Do you support crypto?", a: "Yes! TradeTaper works for Stocks, Forex, Crypto, and Futures markets." }
          ].map((item, idx) => (
            <div key={idx} className="group bg-slate-900/20 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/40 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-3">
                <FaQuestionCircle className="text-emerald-500/50 group-hover:text-emerald-500 transition-colors" /> {item.q}
              </h3>
              <p className="text-slate-400 pl-8 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
