/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/page.tsx
"use client";
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchTrades } from '@/store/features/tradesSlice';
// import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LogoutButton from '@/components/auth/LogoutButton';
import Link from 'next/link';
import { calculateDashboardStats, calculateEquityCurveData, DashboardStats } from '@/utils/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';


// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  positiveIsGood?: boolean; // For coloring P/L values
  isCurrency?: boolean;
  isPercentage?: boolean;
}

const StatCard = ({ title, value, description, positiveIsGood, isCurrency, isPercentage }: StatCardProps) => {
  let valueColor = 'text-white';
  if (typeof value === 'number' && positiveIsGood !== undefined) {
    if (value > 0 && positiveIsGood) valueColor = 'text-green-400';
    else if (value < 0 && positiveIsGood) valueColor = 'text-red-400';
    else if (value < 0 && !positiveIsGood) valueColor = 'text-green-400'; // e.g. for Avg Loss, smaller (less negative) is better
    else if (value > 0 && !positiveIsGood) valueColor = 'text-red-400';
  }

  const displayValue = typeof value === 'number'
    ? (isCurrency ? value.toFixed(2) : (isPercentage ? value.toFixed(2) + '%' : value.toFixed(2)))
    : value;


  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-gray-400">{title}</h3>
      <p className={`text-3xl font-semibold mt-1 ${valueColor}`}>{displayValue}</p>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};


export default function DashboardPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { trades, isLoading: tradesLoading } = useSelector((state: RootState) => state.trades);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && trades.length === 0) { // Fetch only if trades aren't already loaded
      dispatch(fetchTrades());
    }
  }, [dispatch, isAuthenticated, trades.length]);

  // Use useMemo to calculate stats only when trades change
  const dashboardStats = useMemo(() => {
    if (trades.length > 0) {
      return calculateDashboardStats(trades);
    }
    return null;
  }, [trades]);

  const equityCurveData = useMemo(() => {
    if (trades.length > 0) {
      return calculateEquityCurveData(trades);
    }
    return [{ date: new Date().toISOString().split('T')[0], value: 0 }]; // Default for empty chart
  }, [trades]);

  if (tradesLoading && trades.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading dashboard data...</div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h1 className="text-3xl font-bold mb-4 md:mb-0">
              Welcome, {user?.firstName || user?.email || 'Trader'}!
            </h1>
            {/* <div className="flex items-center space-x-4">
                <Link href="/trades" className="text-blue-400 hover:underline">
                  View Trades
                </Link>
                <Link href="/analytics" className="text-blue-400 hover:underline"> 
                  View Analytics
                </Link>
                <LogoutButton />
            </div> */}
          </div>

          {dashboardStats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Net P&L" value={dashboardStats.totalNetPnl} isCurrency positiveIsGood={true} />
                <StatCard title="Win Rate" value={dashboardStats.winRate} isPercentage positiveIsGood={true} />
                <StatCard title="Profit Factor" value={dashboardStats.profitFactor} positiveIsGood={true} />
                <StatCard title="Avg. Win" value={dashboardStats.averageWin} isCurrency positiveIsGood={true} />
                <StatCard title="Avg. Loss" value={dashboardStats.averageLoss} isCurrency positiveIsGood={false} />
                <StatCard title="Total Trades" value={dashboardStats.totalTrades} />
                <StatCard title="Winning Trades" value={dashboardStats.winningTrades} />
                <StatCard title="Losing Trades" value={dashboardStats.losingTrades} />
              </div>

              {/* Equity Curve Chart */}
              <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-200">Equity Curve</h2>
                {equityCurveData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={equityCurveData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                        <XAxis
                            dataKey="date"
                            stroke="#A0AEC0"
                            tickFormatter={(tick) => format(new Date(tick), 'MMM dd')}
                            dy={10}
                        />
                        <YAxis stroke="#A0AEC0" dx={-10} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#E2E8F0' }}
                            itemStyle={{ color: '#63B3ED' }}
                        />
                        <Legend wrapperStyle={{ color: '#A0AEC0' }} />
                        <Line type="monotone" dataKey="value" name="Cumulative P&L" stroke="#63B3ED" strokeWidth={2} dot={false} />
                    </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-400 text-center py-10">Not enough closed trades with P&L to display equity curve.</p>
                )}
              </div>

              {/* You can add more sections like Recent Trades list here */}

            </>
          ) : (
            <p className="text-center text-gray-400 mt-10">
              No trades recorded yet, or still loading. Add some trades to see your dashboard populate!
            </p>
          )}
        </div>
      </div>
  );
}