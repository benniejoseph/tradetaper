"use client";

import React, { useState } from 'react';
import ManageAccounts from '@/components/settings/ManageAccounts';
import MT5AccountsTab from '@/components/settings/MT5AccountsTab';
import { FaCogs, FaUserCircle, FaUsers, FaServer } from 'react-icons/fa';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function AccountSettingsPage() {
  const tabs: TabItem[] = [
    { id: 'manual', label: 'Manual Accounts', icon: <FaUsers className="w-5 h-5" /> },
    { id: 'mt5', label: 'MetaTrader 5', icon: <FaServer className="w-5 h-5" /> },
    // Future tabs can be added here, e.g.:
    // { id: 'tradingview', label: 'TradingView', icon: <FaChartLine className="w-5 h-5" /> },
  ];

  const [activeTab, setActiveTab] = useState<string>('manual');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            Trading Accounts
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your trading accounts and connections
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaUserCircle className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaCogs className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-t-2xl border border-emerald-200/50 dark:border-emerald-700/30 overflow-hidden">
        <div className="border-b border-emerald-200 dark:border-emerald-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {activeTab === 'manual' && (
            <ManageAccounts />
          )}
          
          {activeTab === 'mt5' && (
            <MT5AccountsTab />
          )}
          
          {/* Additional tab contents can be added here */}
        </div>
      </div>
    </div>
  );
} 