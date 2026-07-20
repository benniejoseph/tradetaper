// src/components/backtesting/workbench/DrawingToolbar.tsx
'use client';

import React from 'react';
import { DrawingTool, TOOL_COLOR } from '@/utils/drawings';

interface Props {
  activeTool:   DrawingTool;
  onChange:     (tool: DrawingTool) => void;
  drawingCount: number;
  onClear:      () => void;
}

const TOOLS: { tool: DrawingTool; label: string; title: string }[] = [
  { tool: 'none',       label: '↖',  title: 'Select / Pan (Esc)'          },
  { tool: 'horizontal', label: '—',  title: 'Horizontal Line (H)'         },
  { tool: 'trend',      label: '╱',  title: 'Trend Line (T)'              },
  { tool: 'rectangle',  label: '▭',  title: 'Rectangle Zone (R)'         },
  { tool: 'fibonacci',  label: 'F',  title: 'Fibonacci Retracement (B)'  },
];

export default function DrawingToolbar({ activeTool, onChange, drawingCount, onClear }: Props) {
  return (
    <div className="flex items-center gap-0.5">
      {/* Left divider */}
      <div className="w-px h-5 bg-white/10 mr-2" />

      {TOOLS.map(({ tool, label, title }) => {
        const isActive = activeTool === tool;
        const color    = TOOL_COLOR[tool];

        return (
          <button
            key={tool}
            title={title}
            onClick={() => onChange(tool)}
            className="px-2 py-1 rounded text-[12px] font-mono font-semibold transition-all select-none"
            style={
              isActive
                ? { color, background: color + '18', border: `1px solid ${color}55` }
                : { color: '#475569', border: '1px solid transparent' }
            }
          >
            {label}
          </button>
        );
      })}

      {/* Clear all drawings */}
      {drawingCount > 0 && (
        <>
          <div className="w-px h-4 bg-white/10 mx-1.5" />
          <button
            onClick={onClear}
            title={`Clear ${drawingCount} drawing${drawingCount !== 1 ? 's' : ''}`}
            className="px-1.5 py-1 rounded text-[10px] font-mono text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            ✕{drawingCount > 0 && <span className="ml-0.5 text-[9px]">{drawingCount}</span>}
          </button>
        </>
      )}
    </div>
  );
}
