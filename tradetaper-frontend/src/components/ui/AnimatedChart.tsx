'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

interface AnimatedChartProps {
  data: any[];
  type?: 'line' | 'area' | 'bar' | 'pie' | 'radial';
  height?: number;
  colors?: string[];
  animate?: boolean;
  gradient?: boolean;
  interactive?: boolean;
  loading?: boolean;
  theme?: 'light' | 'dark';
}

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

const CustomTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-3 rounded-lg shadow-lg border ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-600 text-white' 
            : 'bg-white border-gray-200'
        }`}
      >
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

const LoadingSkeleton = ({ height }: { height: number }) => (
  <div className="flex items-center justify-center" style={{ height }}>
    <motion.div
      className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export const AnimatedChart: React.FC<AnimatedChartProps> = ({
  data,
  type = 'line',
  height = 300,
  colors = defaultColors,
  animate = true,
  gradient = false,
  interactive = true,
  loading = false,
  theme = 'light',
}) => {
  const [animationProgress, setAnimationProgress] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate && !loading) {
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [animate, loading]);

  if (loading) {
    return <LoadingSkeleton height={height} />;
  }

  const commonProps = {
    data,
    height,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            {interactive && <Tooltip content={<CustomTooltip theme={theme} />} />}
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ fill: colors[index % colors.length], strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                animationDuration={animate ? 1500 : 0}
                animationBegin={index * 200}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {gradient && colors.map((color, index) => (
                <linearGradient key={index} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            {interactive && <Tooltip content={<CustomTooltip theme={theme} />} />}
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fillOpacity={1}
                fill={gradient ? `url(#colorGradient${index})` : colors[index % colors.length]}
                animationDuration={animate ? 1500 : 0}
                animationBegin={index * 200}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
            />
            {interactive && <Tooltip content={<CustomTooltip theme={theme} />} />}
            {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                animationDuration={animate ? 1000 : 0}
                animationBegin={index * 100}
              />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart width={400} height={height}>
            {interactive && <Tooltip content={<CustomTooltip theme={theme} />} />}
            <Pie
              data={data}
              cx={200}
              cy={height / 2}
              outerRadius={height / 3}
              fill="#8884d8"
              dataKey="value"
              animationDuration={animate ? 1000 : 0}
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        );

      case 'radial':
        return (
          <RadialBarChart width={400} height={height} cx={200} cy={height / 2} innerRadius="10%" outerRadius="80%" data={data}>
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={colors[0]}
              animationDuration={animate ? 1500 : 0}
            />
            {interactive && <Tooltip content={<CustomTooltip theme={theme} />} />}
            <Legend />
          </RadialBarChart>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={chartRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`w-full ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
    >
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
};

// Specialized chart components
export const MetricsLineChart: React.FC<{
  data: Array<{ date: string; value: number; target?: number }>;
  title?: string;
  color?: string;
  showTarget?: boolean;
}> = ({ data, title, color = '#3B82F6', showTarget = false }) => {
  return (
    <div className="space-y-4">
      {title && (
        <motion.h3 
          className="text-lg font-semibold text-gray-900 dark:text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {title}
        </motion.h3>
      )}
      <AnimatedChart
        data={data}
        type="line"
        height={250}
        colors={showTarget ? [color, '#10B981'] : [color]}
        gradient={true}
      />
    </div>
  );
};

export const PerformanceAreaChart: React.FC<{
  data: Array<{ date: string; profit: number; loss: number }>;
  title?: string;
}> = ({ data, title }) => {
  return (
    <div className="space-y-4">
      {title && (
        <motion.h3 
          className="text-lg font-semibold text-gray-900 dark:text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {title}
        </motion.h3>
      )}
      <AnimatedChart
        data={data}
        type="area"
        height={300}
        colors={['#10B981', '#EF4444']}
        gradient={true}
      />
    </div>
  );
};

export const AssetDistributionChart: React.FC<{
  data: Array<{ name: string; value: number; percentage: number }>;
  title?: string;
}> = ({ data, title }) => {
  return (
    <div className="space-y-4">
      {title && (
        <motion.h3 
          className="text-lg font-semibold text-gray-900 dark:text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {title}
        </motion.h3>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedChart
          data={data}
          type="pie"
          height={300}
          colors={defaultColors}
        />
        <div className="space-y-3">
          {data.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: defaultColors[index % defaultColors.length] }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="font-bold">{item.value.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {item.percentage.toFixed(1)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RealTimeChart: React.FC<{
  data: Array<{ time: string; price: number }>;
  symbol: string;
  isLive?: boolean;
}> = ({ data, symbol, isLive = false }) => {
  const [liveData, setLiveData] = useState(data);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        // Simulate real-time data updates
        setLiveData(prev => {
          const newData = [...prev];
          const lastPrice = newData[newData.length - 1]?.price || 100;
          const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
          const newPrice = Math.max(0, lastPrice + change);
          
          newData.push({
            time: new Date().toLocaleTimeString(),
            price: newPrice,
          });

          // Keep only last 50 data points
          return newData.slice(-50);
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLive]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {symbol} Live Price
        </h3>
        {isLive && (
          <motion.div
            className="flex items-center space-x-2 text-green-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium">LIVE</span>
          </motion.div>
        )}
      </div>
      
      <AnimatedChart
        data={liveData}
        type="line"
        height={300}
        colors={['#10B981']}
        animate={false} // Disable animation for real-time updates
      />
      
      {liveData.length > 0 && (
        <motion.div
          className="text-center"
          key={liveData[liveData.length - 1]?.price}
          initial={{ scale: 1.2, color: '#10B981' }}
          animate={{ scale: 1, color: '#374151' }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-2xl font-bold">
            ${liveData[liveData.length - 1]?.price.toFixed(2)}
          </span>
        </motion.div>
      )}
    </div>
  );
};