'use client';

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface EquityCurveChartProps {
  equityCurve: number[];
  startingBalance?: number;
  maxDrawdownPct?: number;
  sharpeRatio?: number;
  calmarRatio?: number;
  recoveryFactor?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const equity = payload.find((p: any) => p.dataKey === 'equity');
  const drawdown = payload.find((p: any) => p.dataKey === 'drawdown');
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl text-left">
      <p className="text-slate-400 text-xs mb-2 font-mono">Trade #{label}</p>
      {equity && (
        <p className="text-emerald-400 font-mono font-bold text-sm">
          Equity: $
          {equity.value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </p>
      )}
      {drawdown && drawdown.value < 0 && (
        <p className="text-red-400 font-mono text-sm">
          Drawdown: {drawdown.value.toFixed(2)}%
        </p>
      )}
    </div>
  );
};

const DrawdownTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const drawdown = payload.find((p: any) => p.dataKey === 'drawdown');
  if (!drawdown) return null;
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-2 shadow-2xl text-left">
      <p className="text-slate-400 text-xs font-mono">Trade #{label}</p>
      <p className="text-red-400 font-mono text-sm font-bold">
        {drawdown.value.toFixed(2)}%
      </p>
    </div>
  );
};

export default function EquityCurveChart({
  equityCurve,
  startingBalance = 100000,
  maxDrawdownPct = 0,
  sharpeRatio = 0,
  calmarRatio = 0,
  recoveryFactor = 0,
}: EquityCurveChartProps) {
  const data = useMemo(() => {
    if (!equityCurve || equityCurve.length === 0) return [];
    let peakEquity = startingBalance;
    return equityCurve.map((equity, index) => {
      peakEquity = Math.max(peakEquity, equity);
      const drawdownPct =
        peakEquity > 0 ? ((equity - peakEquity) / peakEquity) * 100 : 0;
      return { trade: index + 1, equity, drawdown: drawdownPct };
    });
  }, [equityCurve, startingBalance]);

  const finalBalance =
    equityCurve.length > 0
      ? equityCurve[equityCurve.length - 1]
      : startingBalance;
  const netPnl = finalBalance - startingBalance;
  const netPnlPct = (netPnl / startingBalance) * 100;
  const isProfit = netPnl >= 0;

  if (!equityCurve || equityCurve.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-3">
        <svg
          className="w-12 h-12 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <span className="text-sm">No equity curve data yet. Record trades to visualize performance.</span>
      </div>
    );
  }

  const equityValues = equityCurve;
  const minEquity = Math.min(...equityValues);
  const maxEquity = Math.max(...equityValues);
  const yRange = maxEquity - minEquity;
  const yPadding = yRange * 0.12 || startingBalance * 0.05;

  const drawdownValues = data.map((d) => d.drawdown);
  const minDrawdown = Math.min(...drawdownValues);

  return (
    <div className="space-y-4">
      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            label: 'Starting Balance',
            value: `$${startingBalance.toLocaleString()}`,
            color: 'text-white',
          },
          {
            label: 'Final Balance',
            value: `$${finalBalance.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
            color: isProfit ? 'text-emerald-400' : 'text-red-400',
          },
          {
            label: 'Net P&L',
            value: `${isProfit ? '+' : ''}${netPnlPct.toFixed(1)}%`,
            color: isProfit ? 'text-emerald-400' : 'text-red-400',
          },
          {
            label: 'Max Drawdown',
            value: `-${maxDrawdownPct.toFixed(1)}%`,
            color: 'text-red-400',
          },
          {
            label: 'Sharpe Ratio',
            value: sharpeRatio.toFixed(2),
            color:
              sharpeRatio >= 1
                ? 'text-emerald-400'
                : sharpeRatio >= 0
                ? 'text-amber-400'
                : 'text-red-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/5"
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              {stat.label}
            </div>
            <div className={`text-sm font-bold font-mono ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Equity Curve ── */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
          >
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="trade"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              label={{
                value: 'Trade #',
                position: 'insideBottom',
                offset: -2,
                fill: '#64748b',
                fontSize: 10,
              }}
            />
            <YAxis
              yAxisId="equity"
              domain={[
                Math.max(0, minEquity - yPadding),
                maxEquity + yPadding,
              ]}
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              yAxisId="equity"
              y={startingBalance}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
              label={{
                value: 'Start',
                position: 'insideTopRight',
                fill: 'rgba(255,255,255,0.25)',
                fontSize: 9,
              }}
            />
            <Area
              yAxisId="equity"
              type="monotone"
              dataKey="equity"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Drawdown Overlay ── */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">
          Drawdown
        </p>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 2, right: 12, bottom: 2, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="drawdownGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.05} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis dataKey="trade" hide />
              <YAxis
                yAxisId="dd"
                domain={[minDrawdown * 1.15, 0]}
                tick={{
                  fontSize: 9,
                  fill: '#64748b',
                  fontFamily: 'monospace',
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                width={36}
              />
              <Tooltip content={<DrawdownTooltip />} />
              <ReferenceLine
                yAxisId="dd"
                y={0}
                stroke="rgba(255,255,255,0.08)"
              />
              <Area
                yAxisId="dd"
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#drawdownGradient)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Secondary Metrics ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Calmar Ratio',
            value: calmarRatio.toFixed(2),
            color:
              calmarRatio >= 1
                ? 'text-emerald-400'
                : calmarRatio >= 0.5
                ? 'text-amber-400'
                : 'text-red-400',
            hint: '≥1 is good',
          },
          {
            label: 'Recovery Factor',
            value: recoveryFactor.toFixed(2),
            color:
              recoveryFactor >= 2
                ? 'text-emerald-400'
                : recoveryFactor >= 1
                ? 'text-amber-400'
                : 'text-red-400',
            hint: '≥2 is good',
          },
          {
            label: 'Total Trades',
            value: String(equityCurve.length),
            color: 'text-white',
            hint: 'in sample',
          },
        ].map((m) => (
          <div
            key={m.label}
            className="text-center p-3 bg-white/[0.02] rounded-xl border border-white/5"
          >
            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
              {m.label}
            </div>
            <div className={`text-sm font-bold font-mono ${m.color}`}>
              {m.value}
            </div>
            <div className="text-[9px] text-slate-600 mt-0.5">{m.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
