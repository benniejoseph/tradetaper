'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { authApiClient } from '@/services/api';
import {
  buildJournalChartDraft,
  writeStoredJournalChartDraft,
} from '@/lib/journalChartDraft';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const getErrorMessage = (error: unknown): string => {
  if (typeof error !== 'object' || error === null) {
    return 'Chart analysis failed. Please try again.';
  }

  const withResponse = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  if (typeof withResponse.response?.data?.message === 'string') {
    return withResponse.response.data.message;
  }
  if (typeof withResponse.message === 'string') {
    return withResponse.message;
  }

  return 'Chart analysis failed. Please try again.';
};

const ChartUploadComponent: React.FC = () => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setPreview = useCallback((nextUrl: string | null) => {
    setPreviewUrl((prevUrl) => {
      if (prevUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(prevUrl);
      }
      return nextUrl;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PNG, JPG, and WEBP files are supported.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum supported size is 5MB.';
    }
    return null;
  };

  const setFile = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreview(null);
      setErrorMessage(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setErrorMessage(null);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] || null;
    setFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile || isAnalyzing) return;
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('chartImage', selectedFile);

      const response = await authApiClient.post('/notes/ai/chart-to-journal', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const chartDraft = buildJournalChartDraft(response.data);
      if (!chartDraft) {
        throw new Error('AI response did not contain enough trade details to prefill.');
      }

      writeStoredJournalChartDraft(chartDraft);
      router.push('/journal/new?source=chart');
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
            : 'border-zinc-300 bg-white dark:border-white/10 dark:bg-[#0A0A0A]'
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleInputChange}
        />

        {!previewUrl ? (
          <div className="space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Upload your chart screenshot
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              PNG, JPG, WEBP up to 5MB. AI will extract trade details and prefill your journal form.
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Upload className="h-4 w-4" />
              Choose Image
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Chart preview"
              className="mx-auto max-h-72 w-full max-w-xl rounded-xl border border-zinc-200 object-contain dark:border-white/10"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
              >
                Replace Image
              </button>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/25 dark:text-red-300 dark:hover:bg-red-500/10"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!selectedFile || isAnalyzing}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing Chart...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze & Prefill Trade Form
          </>
        )}
      </button>
    </div>
  );
};

export default ChartUploadComponent;
