"use client";
import React, { useEffect, useRef, useState } from 'react';
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
  const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);
  const metricMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMetricMenuOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (metricMenuRef.current?.contains(target)) return;
      setIsMetricMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMetricMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMetricMenuOpen]);

  const removeMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => prev.filter(m => m !== metric));
  };

  const addMetric = (metric: MetricType) => {
    if (!selectedMetrics.includes(metric)) {
      setSelectedMetrics(prev => [...prev, metric]);
    }
    setIsMetricMenuOpen(false);
  };

  const getMetricColor = (metric: MetricType): string => {
    switch (metric) {
      case 'pnl': return '#059669';
      case 'netPnl': return '#D97706';
      case 'mae': return '#EF4444';
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
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 p-4 shadow-lg">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-700/20 p-1.5">
            <FaChartLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Performance Chart
          </h2>
        </div>

        {/* Metrics Selection */}
        <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Metrics:</span>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {selectedMetrics.map(metric => (
              <div key={metric} className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-md">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getMetricColor(metric) }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {getMetricLabel(metric)}
                </span>
                <button 
                  onClick={() => removeMetric(metric)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FaTimes className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            
             <div ref={metricMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsMetricMenuOpen((prev) => !prev)}
                  className="rounded-md bg-gradient-to-r from-emerald-50 to-emerald-100 p-1 text-gray-600 transition-all duration-200 hover:bg-emerald-500 hover:text-white dark:from-emerald-950/20 dark:to-emerald-900/20 dark:text-gray-400 dark:hover:bg-emerald-500"
                  aria-label="Add chart metric"
                  aria-expanded={isMetricMenuOpen}
                >
                  <FaPlus className="w-2.5 h-2.5" />
                </button>
                <div className={`absolute right-0 top-full z-10 mt-2 w-36 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 ${isMetricMenuOpen ? 'block' : 'hidden'}`}>
                    {availableMetrics.filter(m => !selectedMetrics.includes(m)).map(m => (
                        <button 
                            key={m}
                            type="button"
                            onClick={() => addMetric(m)}
                            className="block w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
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
      
      <div className="h-56 sm:h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={10}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                  padding: '8px'
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
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700">
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
