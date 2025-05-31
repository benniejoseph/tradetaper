// src/app/(app)/journal/new/page.tsx
"use client";

import TradeForm from '@/components/trades/TradeForm';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen p-4 md:p-8 bg-[var(--color-light-secondary)] dark:bg-dark-primary">
      <div className="w-full">
        <TradeForm 
          onFormSubmitSuccess={handleFormSubmitSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}