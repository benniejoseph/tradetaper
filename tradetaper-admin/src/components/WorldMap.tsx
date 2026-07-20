'use client';

import { motion } from 'framer-motion';
import { MapPin, Users, TrendingUp, DollarSign } from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface GeographicData {
  country: string;
  users: number;
  trades: number;
  revenue: number;
  coordinates: [number, number];
}

interface WorldMapProps {
  data: GeographicData[];
  loading?: boolean;
}

export default function WorldMap({ data, loading }: WorldMapProps) {
  if (loading) {
    return (
      <div className="admin-card admin-card-panel">
        <div className="animate-pulse">
          <div className="h-4 rounded w-1/4 mb-4" style={{ background: 'var(--bg-muted)' }} />
          <div className="h-64 rounded" style={{ background: 'var(--bg-muted)' }} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="admin-card admin-card-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Global User Distribution
        </h3>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--chart-4)' }}>
          <MapPin className="w-4 h-4" />
          <span>{data.length} countries</span>
        </div>
      </div>

      <div className="admin-muted-block mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {data.map((country, index) => (
            <motion.div
              key={country.country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-xl p-4 border transition-colors"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: 'var(--chart-4)',
                    boxShadow: `0 0 ${Math.min(country.users / 100, 20)}px color-mix(in srgb, var(--chart-4) 60%, transparent)`,
                  }}
                />
                <h4 className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {country.country}
                </h4>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span style={{ color: 'var(--text-muted)' }}>Users:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatNumber(country.users)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span style={{ color: 'var(--text-muted)' }}>Trades:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatNumber(country.trades)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span style={{ color: 'var(--text-muted)' }}>Revenue:</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(country.revenue)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-muted-block text-center">
          <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--chart-4)' }}>
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Total Users</span>
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatNumber(data.reduce((sum, country) => sum + country.users, 0))}
          </p>
        </div>

        <div className="admin-muted-block text-center">
          <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--accent-success)' }}>
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Total Trades</span>
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatNumber(data.reduce((sum, country) => sum + country.trades, 0))}
          </p>
        </div>

        <div className="admin-muted-block text-center">
          <div className="flex items-center justify-center gap-2 mb-2" style={{ color: 'var(--accent-warning)' }}>
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Total Revenue</span>
          </div>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(data.reduce((sum, country) => sum + country.revenue, 0))}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
