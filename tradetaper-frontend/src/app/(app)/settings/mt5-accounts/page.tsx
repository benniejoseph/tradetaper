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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
              MetaApi Integration
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              Paid plans only
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Connect MetaTrader accounts via MetaApi or import trades manually
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
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">About MetaApi Integration</h2>
                  <p className="text-gray-500 dark:text-gray-400">Seamless MT4/MT5 sync with full history by default</p>
                </div>
              </div>
              
              <div className="prose prose-blue dark:prose-invert max-w-none">
                <p>
                  Connect your trading account through MetaApi for hands-off syncing and real-time updates. You can
                  still import your history via statement upload when you need a quick backfill or for manual accounts.
                </p>
                
                <h3>How It Works</h3>
                <ul>
                  <li>Securely connect your MT4/MT5 login via MetaApi</li>
                  <li>Full account history syncs automatically</li>
                  <li>Open positions stay updated as SL/TP changes</li>
                  <li>Optionally import statement files for manual accounts</li>
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
                <FaUpload className="w-6 h-6 text-blue-600 dark:text-emerald-400" />
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
