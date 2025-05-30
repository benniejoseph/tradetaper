/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/analytics/BreakdownBarChart.tsx
"use client";
import { StatsByTag, DashboardStats } from '@/utils/analytics';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell // For custom bar colors
} from 'recharts';
import { useState, useMemo } from 'react';

export type PlottableMetric = Exclude<keyof DashboardStats, 'openTrades' | 'averageRMultiple'>;

export interface MetricOption {
  value: PlottableMetric;
  label: string; // User-friendly label for the dropdown
  isPercentage?: boolean;
  isCurrency?: boolean;
}

interface BreakdownBarChartProps {
  data: StatsByTag[]; // Expects data where 'tag' is the category and 'totalNetPnl' is the value
  title: string;
  dataKeyX?: keyof StatsByTag; // Property for X-axis (category name), defaults to 'tag'
  dataKeyBar?: keyof StatsByTag; // Property for Bar value, defaults to 'totalNetPnl'
  barName?: string; // Name for the bar in tooltip/legend
  barColorPositive?: string;
  barColorNegative?: string;
  metricOptions: MetricOption[]; 
  initialMetricValue?: PlottableMetric;
}

const BreakdownBarChart = ({
  data,
  title,
  dataKeyX = 'tag',
  dataKeyBar = 'totalNetPnl',
  barName = 'Net P&L',
  barColorPositive = '#22c55e', // green-500
  barColorNegative = '#ef4444', // red-500
  metricOptions,
  initialMetricValue,
}: BreakdownBarChartProps) => {

  const defaultMetric = initialMetricValue && metricOptions.find(opt => opt.value === initialMetricValue)
                            ? initialMetricValue
                            : (metricOptions.length > 0 ? metricOptions[0].value : undefined);

  const [selectedMetric, setSelectedMetric] = useState<PlottableMetric | undefined>(defaultMetric);

  const currentMetricInfo = useMemo(() => {
    return metricOptions.find(opt => opt.value === selectedMetric);
  }, [selectedMetric, metricOptions]);

  if (!data || data.length === 0) {
    return <p className="text-gray-400 text-center py-4">No data to display for {title.toLowerCase()} chart.</p>;
  }

  if (metricOptions.length === 0 || !selectedMetric || !currentMetricInfo) {
    return <p className="text-gray-400 text-center py-4">Chart metric options not configured.</p>;
  }
  // Filter out items where dataKeyBar is not a valid number or is zero, if desired
  // Or handle it directly in the Cell fill
  const chartData = data.filter(item => typeof item[dataKeyBar] === 'number');

  barName = currentMetricInfo.label;
  // Determine bar color based on metric nature (e.g., P&L, Expectancy vs. Max Drawdown)
  const positiveIsGood = currentMetricInfo.value !== 'maxDrawdown' && currentMetricInfo.value !== 'averageLoss' && currentMetricInfo.value !== 'losingTrades' && currentMetricInfo.value !== 'lossRate';

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-xl mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-2 sm:mb-0">{title}</h2>
        <div className="flex items-center space-x-2">
            <label htmlFor={`${title.replace(/\s+/g, '-')}-metricSelect`} className="text-sm text-gray-400">Metric:</label>
            <select
                id={`${title.replace(/\s+/g, '-')}-metricSelect`}
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as PlottableMetric)}
                className="bg-gray-700 border-gray-600 text-white text-sm rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
            {metricOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            </select>
        </div>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 45 }}> {/* Increased bottom margin */}
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis
                dataKey="tag" // 'tag' from StatsByTag holds the category name
                stroke="#A0AEC0"
                angle={-45}
                textAnchor="end"
                height={80} // Increased height for angled labels
                interval={0}
            />
            <YAxis stroke="#A0AEC0" dx={-10} />
            <Tooltip
              contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }}
              labelStyle={{ color: '#E2E8F0', marginBottom: '4px', fontWeight: 'bold' }}
              itemStyle={{ color: '#A0AEC0' }}
              formatter={(value: number) => {
                if (currentMetricInfo.isCurrency) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (currentMetricInfo.isPercentage) return `${value.toFixed(2)}%`;
                return value.toFixed(2);
              }}
            />
            <Legend wrapperStyle={{ color: '#A0AEC0', paddingTop: '10px' }} />
            <Bar dataKey={selectedMetric} name={barName} radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                    key={`cell-${index}`}
                    fill={(entry[selectedMetric!] as number) >= 0
                        ? (positiveIsGood ? '#22c55e' : '#ef4444') // green for good positive, red for bad positive
                        : (positiveIsGood ? '#ef4444' : '#22c55e') // red for bad negative, green for good negative (e.g. smaller avg loss)
                    }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
         <p className="text-gray-400 text-center py-10">Not enough data for the selected metric to display chart.</p>
      )}
    </div>
  );
};

export default BreakdownBarChart;