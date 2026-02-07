import { Suspense } from 'react';
import DatabaseClient from './client';

export const dynamic = 'force-dynamic';

export default function DatabasePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-950 text-white">Loading...</div>}>
      <DatabaseClient />
    </Suspense>
  );
}