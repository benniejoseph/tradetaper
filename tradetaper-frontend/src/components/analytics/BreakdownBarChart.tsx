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
  barColorPositive = 'var(--color-accent-green)',
  barColorNegative = 'var(--color-accent-red)',
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
    return <p className="text-text-light-secondary text-center py-4">No data to display for {title.toLowerCase()} chart.</p>;
  }

  if (metricOptions.length === 0 || !selectedMetric || !currentMetricInfo) {
    return <p className="text-text-light-secondary text-center py-4">Chart metric options not configured.</p>;
  }
  // Filter out items where dataKeyBar is not a valid number or is zero, if desired
  // Or handle it directly in the Cell fill
  const chartData = data.filter(item => typeof item[dataKeyBar] === 'number');

  barName = currentMetricInfo.label;
  // Determine bar color based on metric nature (e.g., P&L, Expectancy vs. Max Drawdown)
  const positiveIsGood = currentMetricInfo.value !== 'maxDrawdown' && currentMetricInfo.value !== 'averageLoss' && currentMetricInfo.value !== 'losingTrades' && currentMetricInfo.value !== 'lossRate';

  // Construct a unique ID for the select element using the title prop for accessibility and label association.
  const selectId = title ? `${title.toLowerCase().replace(/\s+/g, '-')}-metricSelect` : 'metric-select';

  return (
    <div className="w-full"> {/* Ensure it takes full width of its grid cell in parent */}
      <div className="flex flex-col sm:flex-row justify-end items-center mb-4 sm:mb-2">
        {/* <h2 className="text-xl font-semibold text-gray-200 mb-2 sm:mb-0">{title}</h2> REMOVED TITLE DISPLAY */}
        {metricOptions.length > 1 && ( // Only show selector if there are multiple options
          <div className="flex items-center space-x-2 w-full sm:w-auto">
              <label htmlFor={selectId} className="text-sm text-text-light-primary font-medium">Metric:</label>
              <select
                  id={selectId}
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as PlottableMetric)}
                  className="w-full sm:w-auto bg-dark-primary border border-gray-700 text-text-light-primary text-sm rounded-md p-2 
                             focus:ring-2 focus:ring-accent-green focus:border-accent-green transition-colors duration-150 ease-in-out 
                             shadow-sm hover:border-accent-green"
              >
              {metricOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              </select>
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 45 }}> {/* Increased bottom margin */}
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-700)" />
            <XAxis
                dataKey="tag" // 'tag' from StatsByTag holds the category name
                stroke="var(--color-text-light-secondary)"
                angle={-45}
                textAnchor="end"
                height={80} // Increased height for angled labels
                interval={0}
            />
            <YAxis stroke="var(--color-text-light-secondary)" dx={-10} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-dark-secondary)', border: '1px solid var(--color-gray-700)', borderRadius: '0.375rem' }}
              labelStyle={{ color: 'var(--color-text-light-primary)', marginBottom: '4px', fontWeight: '600' }}
              itemStyle={{ color: 'var(--color-text-light-secondary)' }}
              formatter={(value: number) => {
                if (currentMetricInfo.isCurrency) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                if (currentMetricInfo.isPercentage) return `${value.toFixed(2)}%`;
                return value.toFixed(2);
              }}
            />
            <Legend wrapperStyle={{ color: 'var(--color-text-light-secondary)', paddingTop: '10px' }} />
            <Bar dataKey={selectedMetric} name={barName} radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                    key={`cell-${index}`}
                    fill={(entry[selectedMetric!] as number) >= 0
                        ? (positiveIsGood ? barColorPositive : barColorNegative)
                        : (positiveIsGood ? barColorNegative : barColorPositive)
                    }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
         <p className="text-text-light-secondary text-center py-10">Not enough data for the selected metric to display chart.</p>
      )}
    </div>
  );
};

export default BreakdownBarChart;