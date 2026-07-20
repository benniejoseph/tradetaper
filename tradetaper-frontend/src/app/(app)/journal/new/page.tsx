// src/app/(app)/journal/new/page.tsx - Compact Redesign
"use client";

import { useEffect, useState } from 'react';
import TradeForm from '@/components/trades/TradeForm';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Sparkles, TriangleAlert, X } from 'lucide-react';
import {
  clearStoredJournalChartDraft,
  readStoredJournalChartDraft,
  type StoredJournalChartDraft,
} from '@/lib/journalChartDraft';

export default function NewTradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chartDraft, setChartDraft] = useState<StoredJournalChartDraft | null>(null);
  const isChartSource = searchParams.get('source') === 'chart';

  useEffect(() => {
    if (!isChartSource) {
      setChartDraft(null);
      return;
    }
    setChartDraft(readStoredJournalChartDraft());
  }, [isChartSource]);

  const handleFormSubmitSuccess = () => {
    if (isChartSource) {
      clearStoredJournalChartDraft();
    }
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
              {isChartSource ? 'Review Chart Draft' : 'Log New Trade'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isChartSource ? 'Verify extracted values before saving' : 'Record and analyze your trade'}
            </p>
          </div>
        </div>
      </div>

      {isChartSource && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
          {chartDraft ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4" />
                  Chart draft loaded
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearStoredJournalChartDraft();
                    setChartDraft(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
                >
                  <X className="h-3 w-3" />
                  Clear Draft
                </button>
              </div>
              {chartDraft.analysisSummary && (
                <p className="text-xs text-emerald-700/90 dark:text-emerald-200/90">{chartDraft.analysisSummary}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 font-semibold">
                <TriangleAlert className="h-4 w-4" />
                No chart draft found
              </div>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-200/90">
                Upload a chart first to prefill this form.
              </p>
              <Link
                href="/journal/new/from-chart"
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Go to Chart Upload
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-200 dark:border-white/5 shadow-xl p-6">
        <TradeForm 
          initialData={chartDraft?.draft}
          onFormSubmitSuccess={handleFormSubmitSuccess} 
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
