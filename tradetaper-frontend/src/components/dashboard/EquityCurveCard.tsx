"use client";

import React from 'react';
import DashboardCard from './DashboardCard';
import { FaChartLine } from 'react-icons/fa';
import { 
  ResponsiveContainer, ComposedChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';
import { useTheme } from 'next-themes';

interface EquityCurveCardProps {
  equityCurve: Array<{ date: string; value: number }>;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export default function EquityCurveCard({
  equityCurve,
  timeRange,
  onTimeRangeChange,
}: EquityCurveCardProps) {
  const { theme } = useTheme();
  const rechartsTextFill = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const rechartsGridStroke = theme === 'dark' ? '#374151' : '#E5E7EB';

  return (
    <DashboardCard 
      title="Equity Curve" 
      icon={FaChartLine}
      showInfoIcon  
      infoContent="Cumulative P&L over time. Improve by smoothing volatility and limiting drawdowns while keeping returns positive."
      showTimeRangeSelector
      selectedTimeRange={timeRange}
      onTimeRangeChange={onTimeRangeChange}
      gridSpan="sm:col-span-2 lg:col-span-3"
    >
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={equityCurve} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="accountBalanceFillChart" x1="0" y1="0" x2="0" y2="1"> 
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/> 
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke={rechartsGridStroke} strokeDasharray="3 3" vertical={false}/>
            <XAxis 
              dataKey="date" 
              stroke={rechartsTextFill} 
              tick={{fontSize: 12}} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis 
              stroke={rechartsTextFill} 
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} 
              tick={{fontSize: 12}} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#111827' : '#FFFFFF', 
                border: theme === 'dark' ? '1px solid #1F2937' : '1px solid #E5E7EB', 
                borderRadius: '12px'
              }} 
              labelStyle={{color: rechartsTextFill, fontWeight: 'bold'}}
              itemStyle={{color: '#3B82F6'}}
              formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, 'Balance']} 
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981" 
              fill="url(#accountBalanceFillChart)" 
              strokeWidth={3} 
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#3B82F6', fill: '#3B82F6' }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
}
