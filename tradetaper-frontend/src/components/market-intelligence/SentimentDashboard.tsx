import React, { useState, useEffect } from 'react';
import { FaChartPie, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { authApiClient as api } from '@/services/api';

interface AssetSentiment {
  symbol: string;
  sentimentScore: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  rationale: string;
  keyLevels: number[];
  trend: 'up' | 'down' | 'ranging';
}

interface SentimentReport {
  timestamp: string;
  globalSentiment: {
    score: number;
    description: string;
    summary: string;
  };
  assets: AssetSentiment[];
}

const SentimentDashboard: React.FC = () => {
  const [report, setReport] = useState<SentimentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiment();
  }, []);

  const fetchSentiment = async () => {
    setLoading(true);
    try {
      const response = await api.get('/market-intelligence/ai-analysis');
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch sentiment', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-emerald-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };
  
  const getTrendIcon = (trend: string) => {
     switch(trend) {
       case 'up': return <FaArrowUp className="text-emerald-500" />;
       case 'down': return <FaArrowDown className="text-red-500" />;
       default: return <FaMinus className="text-gray-500" />;
     }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Generating AI Analysis...</div>;
  if (!report) return <div className="p-8 text-center text-red-500">Failed to load analysis.</div>;

  return (
    <div className="flex flex-col space-y-8">
      {/* Global Sentiment */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <FaChartPie className="mr-3 text-emerald-400" />
              Global Market Sentiment
            </h2>
            <div className={`px-4 py-1 rounded-full text-sm font-bold bg-opacity-20 ${report.globalSentiment.score > 50 ? 'bg-emerald-500 text-emerald-300' : 'bg-red-500 text-red-300'}`}>
              {report.globalSentiment.description} ({report.globalSentiment.score}/100)
            </div>
         </div>
         <p className="text-gray-300 text-lg leading-relaxed">{report.globalSentiment.summary}</p>
      </div>

      {/* Assets Grid */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Asset Specific Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {report.assets.map(asset => (
           <div key={asset.symbol} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{asset.symbol}</h4>
                    <span className={`text-sm font-medium ${getSentimentColor(asset.sentiment)} uppercase tracking-wider`}>
                      {asset.sentiment}
                    </span>
                 </div>
                 <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    {getTrendIcon(asset.trend)}
                 </div>
              </div>
              
              <div className="flex-1">
                 <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{asset.rationale}</p>
                 
                 <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 uppercase font-semibold">Key Levels</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {asset.keyLevels.map(lvl => (
                          <span key={lvl} className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs rounded font-mono">
                             {lvl}
                          </span>
                       ))}
                    </div>
                 </div>
              </div>
              
              {/* Sentiment Bar */}
              <div className="mt-4">
                 <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${asset.sentiment === 'bullish' ? 'bg-emerald-500' : asset.sentiment === 'bearish' ? 'bg-red-500' : 'bg-gray-500'}`} 
                      style={{ width: `${asset.sentimentScore}%` }}
                    ></div>
                 </div>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentDashboard;
