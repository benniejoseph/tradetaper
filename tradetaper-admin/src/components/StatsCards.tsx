'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage, getGrowthColor } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  loading?: boolean;
  index: number;
}

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    totalTrades: number;
    userGrowth: number;
    revenueGrowth: number;
    tradeGrowth: number;
    activeGrowth: number;
  };
  loading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, loading, index }: StatCardProps) {
  const isPositive = change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/50"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-700 animate-pulse rounded mt-1"></div>
            ) : (
              <p className="text-2xl font-bold text-white mt-1">{value}</p>
            )}
          </div>
        </div>
        
        {!loading && (
          <div className={`flex items-center space-x-1 ${getGrowthColor(change)}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{formatPercentage(change)}</span>
          </div>
        )}
      </div>
      
      {!loading && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className={`text-xs ${getGrowthColor(change)}`}>
            {isPositive ? '↗' : '↘'} {formatPercentage(Math.abs(change))} from last month
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: loading ? '...' : formatNumber(stats.totalUsers),
      change: stats.userGrowth,
      icon: Users,
    },
    {
      title: 'Active Users',
      value: loading ? '...' : formatNumber(stats.activeUsers),
      change: stats.activeGrowth,
      icon: Activity,
    },
    {
      title: 'Total Revenue',
      value: loading ? '...' : formatCurrency(stats.totalRevenue),
      change: stats.revenueGrowth,
      icon: DollarSign,
    },
    {
      title: 'Total Trades',
      value: loading ? '...' : formatNumber(stats.totalTrades),
      change: stats.tradeGrowth,
      icon: BarChart3,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          change={card.change}
          icon={card.icon}
          loading={loading}
          index={index}
        />
      ))}
    </div>
  );
} 