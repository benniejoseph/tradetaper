"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTradeById, setCurrentTrade } from '@/store/features/tradesSlice';
import TradeForm from '@/components/trades/TradeForm';

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
        <div className="min-h-screen flex items-center justify-center text-center p-4 bg-[var(--color-light-secondary)] dark:bg-dark-primary">
            <p className="text-lg text-[var(--color-text-dark-primary)] dark:text-text-light-primary">Loading trade data...</p>
        </div>
    );
  }

  if (error && !currentTrade) { // Show error only if currentTrade is not available from a previous successful fetch for this ID
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-[var(--color-light-secondary)] dark:bg-dark-primary">
            <p className="text-lg text-accent-red mb-4">Error: {error}</p>
            <button onClick={() => router.push('/journal')} className="px-4 py-2 bg-accent-blue text-white rounded-md hover:bg-accent-blue-darker">
                Back to Journal
            </button>
        </div>
    );
  }
  
  // If currentTrade is null AND not loading and no error, it might mean tradeId was invalid and fetchTradeById rejected but set error to null.
  // Or it could be that the trade was deleted.
  if (!currentTrade && !isLoading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-[var(--color-light-secondary)] dark:bg-dark-primary">
            <p className="text-lg text-[var(--color-text-dark-primary)] dark:text-text-light-primary mb-4">Trade not found or could not be loaded.</p>
            <button onClick={() => router.push('/journal')} className="px-4 py-2 bg-accent-blue text-white rounded-md hover:bg-accent-blue-darker">
                Back to Journal
            </button>
        </div>
    );
  }
  

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[var(--color-light-secondary)] dark:bg-dark-primary">
      <div className="w-full">
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