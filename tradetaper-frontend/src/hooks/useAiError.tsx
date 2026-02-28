/**
 * useAiError — centralised AI error handler.
 *
 * Usage:
 *   const handleAiError = useAiError();
 *   try { await aiCall() } catch(e) { handleAiError(e) }
 *
 * Handles:
 *  403 AI_ACCESS_DENIED  → show feature paywall (FeatureGate overlay)
 *  429 AI_QUOTA_EXCEEDED → show monthly limit modal
 *  other errors          → toast generic message
 */
'use client';

import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export type AiErrorCode = 'AI_ACCESS_DENIED' | 'AI_QUOTA_EXCEEDED';

export interface AiErrorPayload {
  code: AiErrorCode;
  message: string;
  upgradeUrl?: string;
  limit?: number;
  used?: number;
  plan?: string;
}

/**
 * Parses an axios/fetch error and returns an AiErrorPayload if it's
 * a known AI access error, or null otherwise.
 */
export function parseAiError(error: any): AiErrorPayload | null {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 403 && data?.code === 'AI_ACCESS_DENIED') {
    return { code: 'AI_ACCESS_DENIED', message: data.message, upgradeUrl: data.upgradeUrl, plan: data.plan };
  }
  if (status === 429 && data?.code === 'AI_QUOTA_EXCEEDED') {
    return {
      code: 'AI_QUOTA_EXCEEDED',
      message: data.message,
      upgradeUrl: data.upgradeUrl,
      limit: data.limit,
      used: data.used,
      plan: data.plan,
    };
  }
  return null;
}

/**
 * Hook that returns a stable handler for AI errors.
 * Shows a toast + optionally navigates to /plans.
 */
export function useAiError() {
  const router = useRouter();

  const handleAiError = useCallback(
    (error: any) => {
      const aiErr = parseAiError(error);

      if (!aiErr) {
        // Generic error
        const msg = error?.response?.data?.message ?? error?.message ?? 'Something went wrong';
        toast.error(msg);
        return;
      }

      if (aiErr.code === 'AI_ACCESS_DENIED') {
        toast(
          (t) => (
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-sm">
                🔒 Premium Feature
              </p>
              <p className="text-xs text-gray-500">
                {aiErr.message || 'Upgrade to access AI features.'}
              </p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/plans');
                }}
                className="mt-1 w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 py-1.5 text-xs font-semibold text-white"
              >
                View Plans
              </button>
            </div>
          ),
          { duration: 8000, icon: '🔒' }
        );
        return;
      }

      if (aiErr.code === 'AI_QUOTA_EXCEEDED') {
        toast(
          (t) => (
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold text-sm">
                ⚡ Monthly AI Limit Reached
              </p>
              <p className="text-xs text-gray-500">
                {aiErr.used != null && aiErr.limit != null
                  ? `Used ${aiErr.used}/${aiErr.limit} AI calls this month.`
                  : aiErr.message}
              </p>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push('/plans');
                }}
                className="mt-1 w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-1.5 text-xs font-semibold text-white"
              >
                Upgrade for Unlimited
              </button>
            </div>
          ),
          { duration: 8000, icon: '⚡' }
        );
      }
    },
    [router]
  );

  return handleAiError;
}
