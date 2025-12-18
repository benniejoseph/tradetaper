// src/app/(app)/journal/new/page.tsx
"use client";

import TradeForm from '@/components/trades/TradeForm';
import { useRouter } from 'next/navigation';
import { FaPlus, FaArrowLeft } from 'react-icons/fa';

export default function NewTradePage() {
  const router = useRouter();

  const handleFormSubmitSuccess = (/* tradeId?: string */) => {
    // Navigate to the main journal page or the newly created/edited trade detail view
    // For simplicity, navigating back to the journal page.
    // If tradeId is available (e.g. from createTrade response), could go to /journal/preview/tradeId or similar
    router.push('/journal'); 
  };

  const handleCancel = () => {
    router.back(); // Or router.push('/journal');
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
            Log New Trade
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Record your trade details and track your performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleCancel}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
            <FaArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Trade Form Container */}
      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
              <FaPlus className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Trade Details</h2>
              <p className="text-gray-500 dark:text-gray-400">Fill in all the required information about your trade</p>
            </div>
          </div>

          <TradeForm 
            onFormSubmitSuccess={handleFormSubmitSuccess} 
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}