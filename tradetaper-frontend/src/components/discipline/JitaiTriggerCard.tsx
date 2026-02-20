"use client";

import React from 'react';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

export interface JitaiTrigger {
  title: string;
  severity: 'low' | 'medium' | 'high';
  detail: string;
  suggestion: string;
}

interface JitaiTriggerCardProps {
  triggers: JitaiTrigger[];
}

const severityStyles: Record<JitaiTrigger['severity'], string> = {
  low: 'bg-emerald-50/60 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50/60 text-amber-700 border-amber-200',
  high: 'bg-red-50/60 text-red-700 border-red-200',
};

export default function JitaiTriggerCard({ triggers }: JitaiTriggerCardProps) {
  return (
    <AnimatedCard animate={false} variant="default" className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">In‑the‑Moment Coach</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Live triggers based on recent trading behavior
        </p>
      </div>

      {triggers.length === 0 && (
        <div className="text-sm text-gray-500">No active discipline risks detected.</div>
      )}

      <div className="space-y-3">
        {triggers.map((trigger, index) => (
          <div
            key={`${trigger.title}-${index}`}
            className={`rounded-xl border p-3 ${severityStyles[trigger.severity]} dark:border-white/10`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span>{trigger.title}</span>
              <span>{trigger.severity}</span>
            </div>
            <div className="text-sm mt-1">{trigger.detail}</div>
            <div className="text-[11px] mt-2">
              <span className="font-bold">Suggestion:</span> {trigger.suggestion}
            </div>
          </div>
        ))}
      </div>
    </AnimatedCard>
  );
}
