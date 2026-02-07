"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaUserCircle, FaCrown, FaEnvelope, FaCalendarAlt, FaChartLine, FaServer, FaCheckCircle, FaExclamationTriangle, FaUserFriends } from 'react-icons/fa';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const plan = user?.subscription?.plan || 'free';
  const planDetails = user?.subscription?.planDetails;
  
  // Mock usage data if not available
  const usage = {
    trades: { used: 45, limit: planDetails?.limits?.trades || 10 },
    accounts: { used: 1, limit: planDetails?.limits?.manualAccounts || 1 },
  };

  const isPremium = plan === 'premium';
  const isEssential = plan === 'essential';

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <FaUserCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {user?.firstName || 'Trader'} {user?.lastName}
              {isPremium && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20 flex items-center gap-1">
                  <FaCrown className="w-3 h-3" /> PREMIUM
                </span>
              )}
              {isEssential && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/20">
                  ESSENTIAL
                </span>
              )}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
              <FaEnvelope className="w-3 h-3" /> {user?.email}
            </p>
          </div>
        </div>
        
        <Link 
          href="/settings"
          className="px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subscription Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Current Subscription</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your plan and billing</p>
                </div>
                {plan !== 'free' ? (
                    <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                        ACTIVE
                    </span>
                ) : (
                    <Link href="/pricing" className="text-emerald-500 hover:text-emerald-400 text-sm font-bold">
                        Upgrade Now &rarr;
                    </Link>
                )}
             </div>

             <div className="grid md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Plan</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{plan}</span>
                            {plan !== 'free' && <FaCheckCircle className="text-emerald-500 w-5 h-5" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                           {plan === 'free' ? 'Basic features for beginners' : 
                            plan === 'essential' ? 'Advanced tools for serious traders' : 
                            'Ultimate power for professionals'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                         <Link href="/pricing" className="flex-1 py-2.5 text-center text-sm font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20">
                            {plan === 'premium' ? 'Manage Plan' : 'Upgrade Plan'}
                         </Link>
                         <Link href="/billing" className="flex-1 py-2.5 text-center text-sm font-medium rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                            Billing History
                         </Link>
                    </div>
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Plan Features</h3>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                            <span>{plan === 'free' ? '10 Trades/mo' : plan === 'essential' ? '100 Trades/mo' : '500 Trades/mo'}</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                             <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                            <span>{planDetails?.limits?.marketIntelligence === 'full' ? 'Advanced Market Intelligence' : 'Basic Market Intelligence'}</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                             <FaCheckCircle className="text-emerald-500 w-4 h-4 flex-shrink-0" />
                            <span>{planDetails?.limits?.aiAnalysis ? 'AI Pyschology Assistant' : 'Basic Journaling'}</span>
                        </li>
                         {plan === 'free' && (
                            <li className="flex items-center gap-2 text-sm text-gray-400">
                                <FaExclamationTriangle className="text-amber-500 w-4 h-4 flex-shrink-0" />
                                <span>Upgrade for AI Analysis</span>
                            </li>
                         )}
                    </ul>
                </div>
             </div>
          </div>
          
          {/* Recent Activity Placeholder */}
           <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Security</h2>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Email Address</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">Verified</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Password</p>
                        <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                    </div>
                    <button className="text-sm text-emerald-500 hover:text-emerald-400 font-medium">Update</button>
                </div>
           </div>

           {/* Referral Program */}
           <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 relative z-10 flex items-center gap-2">
                    <FaUserFriends className="text-purple-500" /> Referral Program
                </h2>
                
                <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                    <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Invite friends to TradeTaper and earn rewards. Share your unique referral code below.
                        </p>
                        
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 dark:bg-zinc-800 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 font-mono text-lg font-bold text-gray-900 dark:text-white tracking-wider select-all">
                                {user?.referralCode || 'Generate Code'}
                            </div>
                            <button 
                                onClick={() => {
                                    if(user?.referralCode) {
                                        navigator.clipboard.writeText(user.referralCode);
                                        alert("Referral code copied!");
                                    }
                                }}
                                disabled={!user?.referralCode}
                                className="px-4 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors shadow-lg shadow-purple-500/20"
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-purple-100 dark:border-zinc-700/50 w-full md:w-auto min-w-[200px]">
                        <div className="text-center">
                            <span className="block text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                {user?.referralCount || 0}
                            </span>
                            <span className="text-xs uppercase tracking-wider font-bold text-purple-400 dark:text-purple-500">
                                Friends Referred
                            </span>
                        </div>
                    </div>
                </div>
           </div>
        </div>

        {/* Usage Stats Side */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Plan Usage</h2>
                
                <div className="space-y-6">
                    {/* Trades Limit */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FaChartLine /> Monthly Trades
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {usage.trades.used} / {usage.trades.limit}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((usage.trades.used / (typeof usage.trades.limit === 'number' ? usage.trades.limit : 100)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Accounts Limit */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <FaServer /> Connected Accounts
                            </span>
                             <span className="font-medium text-gray-900 dark:text-white">
                                {usage.accounts.used} / {usage.accounts.limit}
                            </span>
                        </div>
                         <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min((usage.accounts.used / (typeof usage.accounts.limit === 'number' ? usage.accounts.limit : 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-xs text-gray-500 text-center mb-4">Need more capacity? Upgrade to unlock unlimited potential.</p>
                    <Link href="/pricing" className="block w-full py-2.5 text-center text-sm font-bold rounded-lg border border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
                        View Upgrade Options
                    </Link>
                </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <h3 className="text-lg font-bold mb-2 relative z-10">Join the Community</h3>
                <p className="text-indigo-200 text-sm mb-4 relative z-10">Connect with other Pro traders and share strategies.</p>
                <button className="w-full py-2 bg-white text-indigo-900 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors relative z-10">
                    Join Discord
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
