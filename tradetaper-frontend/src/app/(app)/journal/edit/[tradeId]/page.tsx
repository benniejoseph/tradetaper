// src/app/(app)/journal/edit/[tradeId]/page.tsx - Compact Redesign
"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById, setCurrentTrade } from '@/store/features/tradesSlice';
import TradeForm from '@/components/trades/TradeForm';
import { ArrowLeft, Edit3, Loader2, AlertCircle } from 'lucide-react';

export default function EditTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { currentTrade, isLoading, error } = useSelector((state: RootState) => state.trades);

  useEffect(() => {
    if (tradeId && !isLoading && (!currentTrade || currentTrade.id !== tradeId)) {
      dispatch(fetchTradeById(tradeId));
    } else if (!tradeId && !isLoading) {
      router.push('/journal');
    }
  }, [dispatch, tradeId, isLoading, currentTrade]);

  useEffect(() => {
    return () => { dispatch(setCurrentTrade(null)); };
  }, [dispatch, tradeId]);

  const handleFormSubmitSuccess = () => router.push('/journal');
  const handleCancel = () => router.back();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 dark:text-white">Loading trade...</div>
        </div>
      </div>
    );
  }

  if (error && !currentTrade) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Error Loading Trade</h3>
        <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{error}</p>
        <button onClick={() => router.push('/journal')} 
          className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all">
          Back to Journal
        </button>
      </div>
    );
  }

  if (!currentTrade && !isLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Edit3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Trade Not Found</h3>
        <p className="text-gray-500 mb-4 text-sm">This trade could not be loaded.</p>
        <button onClick={() => router.push('/journal')} 
          className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all">
          Back to Journal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleCancel}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit3 className="w-6 h-6 text-emerald-500" />
              Edit Trade
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentTrade?.symbol && <span className="font-semibold text-emerald-600">{currentTrade.symbol}</span>}
              {currentTrade?.direction && <span> • {currentTrade.direction}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/5 shadow-xl p-6">
        {currentTrade && (
          <TradeForm 
            initialData={currentTrade} 
            isEditMode={true} 
            onFormSubmitSuccess={handleFormSubmitSuccess}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}