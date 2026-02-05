// src/app/(app)/journal/new/page.tsx - Compact Redesign
"use client";

import TradeForm from '@/components/trades/TradeForm';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';

export default function NewTradePage() {
  const router = useRouter();

  const handleFormSubmitSuccess = () => {
    router.push('/journal');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleCancel}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-emerald-500" />
              Log New Trade
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Record and analyze your trade</p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/5 shadow-xl p-6">
        <TradeForm 
          onFormSubmitSuccess={handleFormSubmitSuccess} 
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}