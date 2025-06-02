"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById, setCurrentTrade } from '@/store/features/tradesSlice';
import TradeForm from '@/components/trades/TradeForm';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';

export default function EditTradePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const params = useParams();
  const tradeId = params.tradeId as string;

  const { currentTrade, isLoading, error } = useSelector((state: RootState) => state.trades);

  // Effect for fetching data
  useEffect(() => {
    if (tradeId) {
      // Only fetch if not already loading AND (no current trade OR current trade is not the one we want)
      if (!isLoading && (!currentTrade || currentTrade.id !== tradeId)) {
        dispatch(fetchTradeById(tradeId));
      }
    } else if (!tradeId && !isLoading) {
      // If no tradeId and not loading, redirect (e.g., if tradeId was cleared or invalid)
      router.push('/journal');
    }
  }, [dispatch, tradeId, isLoading, currentTrade]); // Dependencies that influence fetching logic

  // Effect for cleanup (runs when tradeId changes or on unmount)
  useEffect(() => {
    return () => {
      // Clear the currentTrade from Redux store when the relevant tradeId changes or component unmounts
      dispatch(setCurrentTrade(null));
    };
  }, [dispatch, tradeId]); // Only depends on dispatch and tradeId for cleanup scope

  const handleFormSubmitSuccess = () => {
    router.push('/journal'); // Navigate back to journal after successful edit
  };

  const handleCancel = () => {
    router.back(); // Or router.push('/journal');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">Loading trade data...</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Preparing edit form...</div>
        </div>
      </div>
    );
  }

  if (error && !currentTrade) { // Show error only if currentTrade is not available from a previous successful fetch for this ID
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaEdit className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Trade</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/journal')} 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </button>
        </div>
      </div>
    );
  }
  
  // If currentTrade is null AND not loading and no error, it might mean tradeId was invalid and fetchTradeById rejected but set error to null.
  // Or it could be that the trade was deleted.
  if (!currentTrade && !isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FaEdit className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trade Not Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Trade could not be loaded or was not found.</p>
          <button 
            onClick={() => router.push('/journal')} 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Journal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80 backdrop-blur-sm"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <FaEdit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Edit Trade
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {currentTrade?.symbol ? `Editing ${currentTrade.symbol} trade` : 'Modify trade details and settings'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200">
        <div className="p-8">
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
    </div>
  );
} 