import { Suspense } from 'react';
import ClientPage from './client';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white">Loading...</div>}>
      <ClientPage />
    </Suspense>
  );
}
