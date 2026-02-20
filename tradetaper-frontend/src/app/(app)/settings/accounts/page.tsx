"use client";

import React, { useState } from 'react';
import ManageAccounts from '@/components/settings/ManageAccounts';
import { FaCogs, FaUserCircle, FaFileImport, FaPenFancy } from 'react-icons/fa';
import AlertModal from '@/components/ui/AlertModal';

export default function AccountSettingsPage() {
  const [addFormSignal, setAddFormSignal] = useState(0);
  const [alertState, setAlertState] = useState({ isOpen: false, title: 'Notice', message: '' });
  const closeAlert = () => setAlertState((prev) => ({ ...prev, isOpen: false }));
  const showAlert = (message: string, title = 'Notice') =>
    setAlertState({ isOpen: true, title, message });

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-300">
            Manual Account / Import
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
            Manage your trading ecosystem. Connect new data sources manually or import historical data to fuel your AI agent workflow.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-gray-200/60 dark:border-gray-800 hover:border-emerald-400/60 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all duration-200">
            <FaUserCircle className="w-4 h-4" />
          </button>
          
          <button className="p-2.5 rounded-xl bg-white/80 dark:bg-black/60 border border-gray-200/60 dark:border-gray-800 hover:border-emerald-400/60 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all duration-200">
            <FaCogs className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <FaPenFancy className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Manual Account</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Ideal for real-time tracking. Enter your broker details, configure leverage, and set your initial balance manually.
          </p>
          <button
            onClick={() => setAddFormSignal((prev) => prev + 1)}
            className="mt-4 inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-300 font-semibold text-sm hover:text-emerald-500"
          >
            Start Configuration <span aria-hidden>→</span>
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
            <FaFileImport className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import from File</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Upload your CSV, Excel, or broker statements. The AI will parse your history and generate performance metrics automatically.
          </p>
          <button
            onClick={() => showAlert('File import will be available soon.', 'Import from File')}
            className="mt-4 inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-300 font-semibold text-sm hover:text-emerald-500"
          >
            Select File <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* Manual Accounts Section */}
      <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-6 shadow-sm">
        <ManageAccounts addFormSignal={addFormSignal} hideAddButton />
      </div>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        title={alertState.title}
        message={alertState.message}
      />
    </div>
  );
}
