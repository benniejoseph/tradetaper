'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import ChartUploadComponent from '@/components/journal/ChartUploadComponent';

const NewJournalFromChartPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/10 dark:bg-[#0A0A0A] dark:text-zinc-300 dark:hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0A0A0A]">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Create Journal Entry from Chart</h1>
        </div>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Upload one chart screenshot. AI extracts visible trade context and opens a prefilled trade form for review.
        </p>
        <ChartUploadComponent />
      </div>
    </div>
  );
};

export default NewJournalFromChartPage;
