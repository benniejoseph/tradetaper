'use client';

import React from 'react';
import { 
  FaBrain, 
  FaCalendarAlt,
  FaNewspaper,
  FaChartPie,
} from 'react-icons/fa';
import EconomicCalendar from '@/components/market-intelligence/EconomicCalendar';
import NewsFeed from '@/components/market-intelligence/NewsFeed';
import SentimentDashboard from '@/components/market-intelligence/SentimentDashboard';
import CommitmentOfTraders from '@/components/market-intelligence/CommitmentOfTraders';
import { FeatureGate } from '@/components/common/FeatureGate';

import { useRouter, useSearchParams } from 'next/navigation';

export default function MarketIntelligencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const requestedTab = searchParams.get('tab') || 'economic-calendar';
  const validTabs = new Set(['economic-calendar', 'news', 'ai-analysis', 'cot']);
  const activeTab = validTabs.has(requestedTab) ? requestedTab : 'economic-calendar';

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black p-2 sm:p-4 lg:p-6 overflow-auto">
      <div className="w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                <FaBrain className="inline-block mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                Market Intelligence
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Economic calendar, market news, and AI analysis
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 overflow-x-auto">
          <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-2">
            {[
              { id: 'economic-calendar', label: 'Economic Calendar', icon: FaCalendarAlt },
              { id: 'cot', label: 'Commitment of Traders', icon: FaChartPie },
              { id: 'news', label: 'News Hub', icon: FaNewspaper },
              { id: 'ai-analysis', label: 'AI Analysis', icon: FaBrain },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-emerald-100 hover:bg-gray-100 dark:hover:bg-emerald-950/40'
                }`}
              >
                <tab.icon className="mr-1 sm:mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Economic Calendar Tab */}
        {activeTab === 'economic-calendar' && (
          <div className="space-y-6">
            <EconomicCalendar />
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <NewsFeed />
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai-analysis' && (
           <FeatureGate feature="aiAnalysis">
             <div className="space-y-6">
               <SentimentDashboard />
             </div>
           </FeatureGate>
        )}

        {/* COT Tab */}
        {activeTab === 'cot' && (
          <div className="space-y-6">
            <CommitmentOfTraders />
          </div>
        )}
      </div>
    </div>
  );
}
