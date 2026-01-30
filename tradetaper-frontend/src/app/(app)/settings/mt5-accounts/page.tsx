"use client";

import React, { useState } from 'react';
import MT5AccountsList from '@/components/settings/MT5AccountsList';
import { StatementUpload } from '@/components/settings/StatementUpload';
import { FaServer, FaUpload, FaList } from 'react-icons/fa';

type TabType = 'accounts' | 'upload';

export default function MT5AccountsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('accounts');

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            MetaTrader Integration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Import your MT4/MT5 trading data via file upload
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`
            flex items-center gap-2 px-4 py-3 font-medium transition-colors
            ${activeTab === 'accounts'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-300'
            }
          `}
        >
          <FaList className="w-4 h-4" />
          Accounts
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`
            flex items-center gap-2 px-4 py-3 font-medium transition-colors
            ${activeTab === 'upload'
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-gray-400 hover:text-gray-300'
            }
          `}
        >
          <FaUpload className="w-4 h-4" />
          Import Trades
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' && (
        <>
          {/* About Section */}
          <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
                  <FaServer className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">About MT Integration</h2>
                  <p className="text-gray-500 dark:text-gray-400">How TradeTaper connects with your MetaTrader accounts</p>
                </div>
              </div>
              
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p>
                  Import your trading data from MT4/MT5 into TradeTaper using the file upload feature.
                  Export your statement from MetaTrader and upload it here to automatically import all closed trades.
                </p>
                
                <h3>How It Works</h3>
                <ul>
                  <li>Export your account statement from MT4/MT5</li>
                  <li>Upload the file (HTML or CSV format)</li>
                  <li>TradeTaper parses and imports your trades</li>
                  <li>Duplicates are automatically detected and skipped</li>
                </ul>
              </div>
            </div>
          </div>

          {/* MT5 Accounts List Component */}
          <MT5AccountsList />
        </>
      )}

      {activeTab === 'upload' && (
        <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl">
                <FaUpload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Import Trades</h2>
                <p className="text-gray-500 dark:text-gray-400">Upload your MT4/MT5 statement to import trades</p>
              </div>
            </div>
            
            <StatementUpload />
          </div>
        </div>
      )}
    </div>
  );
}