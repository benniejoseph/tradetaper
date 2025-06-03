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
  // For demo purposes, we'll create a simplified SVG world map
  // In production, you'd integrate with Leaflet or similar mapping library

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Global User Distribution</h3>
        <div className="flex items-center space-x-2 text-blue-400">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{data.length} countries</span>
        </div>
      </div>

      {/* Simplified World Map Visualization */}
      <div className="relative bg-gray-900 rounded-lg p-6 mb-6" style={{ minHeight: '300px' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {data.map((country, index) => (
                <motion.div
                  key={country.country}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full bg-blue-500"
                      style={{
                        boxShadow: `0 0 ${Math.min(country.users / 100, 20)}px rgba(59, 130, 246, 0.6)`
                      }}
                    ></div>
                    <h4 className="font-medium text-white truncate">{country.country}</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Users:</span>
                      <span className="text-white font-medium">{formatNumber(country.users)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trades:</span>
                      <span className="text-white font-medium">{formatNumber(country.trades)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Revenue:</span>
                      <span className="text-white font-medium">{formatCurrency(country.revenue)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-blue-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Total Users</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatNumber(data.reduce((sum, country) => sum + country.users, 0))}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Total Trades</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatNumber(data.reduce((sum, country) => sum + country.trades, 0))}
          </p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(data.reduce((sum, country) => sum + country.revenue, 0))}
          </p>
        </div>
      </div>
    </motion.div>
  );
} 