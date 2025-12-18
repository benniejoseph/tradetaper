"use client";

import React from 'react';
import MT5AccountsList from '@/components/settings/MT5AccountsList';
import { FaServer } from 'react-icons/fa';

export default function MT5AccountsPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            MetaTrader 5 Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your MT5 accounts to automatically import your trading data
          </p>
        </div>
      </div>

      {/* About MT5 Integration */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
              <FaServer className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">About MT5 Integration</h2>
              <p className="text-gray-500 dark:text-gray-400">How TradeTaper connects with your MetaTrader 5 accounts</p>
            </div>
          </div>
          
          <div className="prose prose-blue dark:prose-invert max-w-none">
            <p>
              The MetaTrader 5 integration allows you to automatically import your trading data from MT5 into TradeTaper.
              This integration is read-only and will never place trades on your behalf.
            </p>
            
            <h3>How It Works</h3>
            <ul>
              <li>Add your MT5 account details (server, login, password)</li>
              <li>TradeTaper securely stores your credentials</li>
              <li>We periodically sync your trading data (trades, balance, etc.)</li>
              <li>Your data appears in your TradeTaper journal automatically</li>
            </ul>
            
            <h3>Security</h3>
            <p>
              Your MT5 credentials are encrypted and stored securely. We use a read-only connection
              to your MT5 account, which means TradeTaper can never place trades or withdraw funds.
            </p>
          </div>
        </div>
      </div>

      {/* MT5 Accounts List Component */}
      <MT5AccountsList />
    </div>
  );
} 