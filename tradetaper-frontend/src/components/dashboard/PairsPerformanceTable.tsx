"use client";
import React from 'react';
import { FaCalendarAlt } from 'react-icons/fa';

interface PairStats {
  symbol: string;
  returnDollar: number;
  profitFactor: number;
  mae: number;
  winPercent: number;
  tradesCount: number;
  returnLoss: number;
}

interface PairsPerformanceTableProps {
  data: PairStats[];
}

export default function PairsPerformanceTable({ data }: PairsPerformanceTableProps) {
  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-emerald-200/30 dark:border-emerald-700/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl">
            <FaCalendarAlt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Top Performing Pairs
          </h2>
        </div>
      </div>
      
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 backdrop-blur-sm">
              <tr className="border-b border-emerald-200/30 dark:border-emerald-700/30">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pairs
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Return $
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Profit Factor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MAE
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Win %
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trades
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-200/30 dark:divide-emerald-700/30">
              {data.map((pair) => (
                <tr key={pair.symbol} className="group hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 dark:hover:from-emerald-950/20 dark:hover:to-emerald-900/20 transition-all duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {pair.symbol}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-bold ${
                      pair.returnDollar >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {pair.returnDollar >= 0 ? '+' : ''}${pair.returnDollar.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                    {pair.profitFactor === 999 ? '∞' : pair.profitFactor.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-red-600 dark:text-red-400">
                    ${Math.abs(pair.mae).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-semibold ${
                      pair.winPercent >= 50 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                    }`}>
                      {pair.winPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {pair.tradesCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCalendarAlt className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Pairs Data Available</h3>
          <p className="text-gray-600 dark:text-gray-400">Complete some trades to see your pairs performance</p>
        </div>
      )}
    </div>
  );
}
