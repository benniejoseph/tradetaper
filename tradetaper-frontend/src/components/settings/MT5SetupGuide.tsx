"use client";

import React from 'react';
import { FaCheckCircle, FaServer, FaUserShield, FaTerminal } from 'react-icons/fa';

const MT5SetupGuide = () => {
  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg overflow-hidden">
      <div className="p-8 space-y-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
            <FaTerminal className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              MT5 Setup Guide
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Step-by-step instructions to connect and sync your MetaTrader account.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 dark:bg-white/5 rounded-xl border border-emerald-200/40 dark:border-emerald-700/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
              <FaCheckCircle className="w-4 h-4" />
              Automatic Sync (Recommended)
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Go to MT5 Accounts and click Add Account.</li>
              <li>Enter broker server, login, and investor password.</li>
              <li>Click Enable Auto-Sync.</li>
              <li>Wait for status to show RUNNING.</li>
              <li>Your trades will appear automatically.</li>
            </ol>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              If status is stuck at STARTING, double-check your server name and investor password.
            </div>
          </div>

          <div className="bg-white/80 dark:bg-white/5 rounded-xl border border-emerald-200/40 dark:border-emerald-700/30 p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
              <FaServer className="w-4 h-4" />
              Manual EA Sync (Fallback)
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>Install the TradeTaperSync EA in MT5.</li>
              <li>Allow WebRequest for https://api.tradetaper.com.</li>
              <li>Attach EA to any chart.</li>
              <li>Paste TerminalId and AuthToken into EA inputs.</li>
              <li>Enable Algo Trading and wait for sync.</li>
            </ol>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              TerminalId and AuthToken are available in the Auto-Sync panel once enabled.
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-white/5 rounded-xl border border-emerald-200/40 dark:border-emerald-700/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
            <FaUserShield className="w-4 h-4" />
            Security Tips
          </div>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li>Use the investor (read-only) password for maximum safety.</li>
            <li>Never share your master password with third-party tools.</li>
            <li>If you rotate your MT5 password, update it here immediately.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MT5SetupGuide;
