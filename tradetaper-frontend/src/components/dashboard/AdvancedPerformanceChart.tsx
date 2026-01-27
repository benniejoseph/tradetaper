"use client";
import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid
} from 'recharts';
import { FaChartLine, FaTimes, FaPlus } from 'react-icons/fa';

interface ChartDataPoint {
  date: string;
  pnl: number;
  netPnl: number;
  mae: number;
}

type MetricType = 'pnl' | 'netPnl' | 'mae';

interface AdvancedPerformanceChartProps {
  data: ChartDataPoint[];
}

export default function AdvancedPerformanceChart({ data }: AdvancedPerformanceChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['pnl', 'netPnl', 'mae']);

  const removeMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => prev.filter(m => m !== metric));
  };

  const addMetric = (metric: MetricType) => {
    if (!selectedMetrics.includes(metric)) {
      setSelectedMetrics(prev => [...prev, metric]);
    }
  };

  const getMetricColor = (metric: MetricType): string => {
    switch (metric) {
      case 'pnl': return '#3B82F6'; // Blue
      case 'netPnl': return '#EC4899'; // Pink
      case 'mae': return '#10B981'; // Green/Teal
      default: return '#6B7280';
    }
  };

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'pnl': return 'P&L';
      case 'netPnl': return 'Net P&L';
      case 'mae': return 'MAE';
      default: return metric;
    }
  };

  const availableMetrics: MetricType[] = ['pnl', 'netPnl', 'mae'];

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
            <FaChartLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Performance Chart
          </h2>
        </div>

        {/* Metrics Selection */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Metrics:</span>
          <div className="flex flex-wrap items-center gap-2">
            {selectedMetrics.map(metric => (
              <div key={metric} className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getMetricColor(metric) }}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getMetricLabel(metric)}
                </span>
                <button 
                  onClick={() => removeMetric(metric)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {/* Simple dropdown or toggle for adding metrics back could be added here if needed, 
                for now keeping it simple as per original design or just showing all usually */}
             <div className="relative group">
                <button className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 hover:bg-emerald-500 dark:hover:bg-emerald-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200">
                  <FaPlus className="w-3 h-3" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10">
                    {availableMetrics.filter(m => !selectedMetrics.includes(m)).map(m => (
                        <button 
                            key={m}
                            onClick={() => addMetric(m)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                        >
                            {getMetricLabel(m)}
                        </button>
                    ))}
                    {availableMetrics.every(m => selectedMetrics.includes(m)) && (
                        <div className="px-4 py-2 text-xs text-gray-500">All added</div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-96">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number, name: string) => [`$${value.toFixed(2)}`, getMetricLabel(name as MetricType)]}
              />
              {selectedMetrics.includes('pnl') && (
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke={getMetricColor('pnl')}
                  strokeWidth={3}
                  dot={false}
                />
              )}
              {selectedMetrics.includes('netPnl') && (
                <Line
                  type="monotone"
                  dataKey="netPnl"
                  stroke={getMetricColor('netPnl')}
                  strokeWidth={3}
                  dot={false}
                />
              )}
              {selectedMetrics.includes('mae') && (
                <Line
                  type="monotone"
                  dataKey="mae"
                  stroke={getMetricColor('mae')}
                  strokeWidth={3}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaChartLine className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Chart Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400">Complete some trades to see your performance chart</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
