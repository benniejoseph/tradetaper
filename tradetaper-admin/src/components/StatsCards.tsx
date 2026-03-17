'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, BarChart3 } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

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
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="admin-card p-6 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'var(--bg-muted)' }}>
            <Icon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</p>
            {loading ? (
              <div className="h-8 w-24 animate-pulse rounded mt-1" style={{ background: 'var(--bg-muted)' }}></div>
            ) : (
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{value}</p>
            )}
          </div>
        </div>
        
        {!loading && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isPositive ? 'badge-success' : 'badge-danger'}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs font-medium">{formatPercentage(Math.abs(change))}</span>
          </div>
        )}
      </div>
      
      {!loading && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            <span style={{ color: isPositive ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
              {isPositive ? '↗' : '↘'} {formatPercentage(Math.abs(change))}
            </span>{' '}
            from last month
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