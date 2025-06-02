"use client";

import React from 'react';
import ManageAccounts from '@/components/settings/ManageAccounts';
import { FaCogs, FaUserCircle, FaUsers } from 'react-icons/fa';

export default function AccountSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your trading accounts and preferences
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaUserCircle className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-purple-500 dark:hover:bg-purple-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaCogs className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Container */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
              <FaUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trading Accounts</h2>
              <p className="text-gray-500 dark:text-gray-400">Manage your connected trading accounts</p>
            </div>
          </div>
          
          <ManageAccounts />
        </div>
      </div>
    </div>
  );
} 