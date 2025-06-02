"use client";
import React from 'react';
import { FaBook, FaChartLine, FaCalculator, FaLightbulb, FaExternalLinkAlt } from 'react-icons/fa';

const guides = [
  {
    id: 'getting-started',
    title: 'Getting Started with TradeTaper',
    description: 'Learn how to set up your trading journal and start tracking your performance.',
    icon: FaBook,
    content: [
      'Log your first trade in the Journal section',
      'Connect your trading accounts (if available)',
      'Set up your trading preferences and goals',
      'Understanding the Dashboard overview',
      'Navigating the main sections: Journal, Analytics, Calendar'
    ]
  },
  {
    id: 'logging-trades',
    title: 'Effective Trade Logging',
    description: 'Master the art of comprehensive trade documentation for better analysis.',
    icon: FaCalculator,
    content: [
      'Record entry/exit prices and timestamps accurately',
      'Document your trade setup and reasoning',
      'Add screenshots and market context',
      'Tag trades with session types (London, New York, Asia)',
      'Use the bulk import feature for multiple trades',
      'Set up custom trade categories and tags'
    ]
  },
  {
    id: 'analytics-features',
    title: 'Understanding Analytics & Metrics',
    description: 'Leverage TradeTaper\'s analytics to improve your trading performance.',
    icon: FaChartLine,
    content: [
      'Win rate analysis and profit factor calculations',
      'R-Multiple tracking for risk management',
      'Daily and monthly P&L trends',
      'Session-based performance analysis',
      'Calendar heatmap for pattern recognition',
      'Export data for external analysis'
    ]
  },
  {
    id: 'risk-management',
    title: 'Risk Management Tools',
    description: 'Use TradeTaper\'s features to maintain disciplined risk management.',
    icon: FaLightbulb,
    content: [
      'Set account balance and track equity curve',
      'Monitor daily drawdown limits',
      'Calculate position sizing based on account risk',
      'Track commission costs and their impact',
      'Analyze worst-case scenarios with MAE tracking',
      'Set up performance alerts and thresholds'
    ]
  },
  {
    id: 'advanced-features',
    title: "Advanced TradeTaper Features",
    description: "Unlock the full potential of TradeTaper's professional tools.",
    icon: FaChartLine,
    content: [
      'Real-time WebSocket updates across browser tabs',
      'Bulk operations for efficient trade management',
      'Custom filters and search functionality',
      'Performance comparison across different accounts',
      'Daily balance tracking and history',
      'Export trades in multiple formats (CSV, PDF)'
    ]
  },
  {
    id: 'best-practices',
    title: 'Trading Journal Best Practices',
    description: 'Professional tips for maintaining a world-class trading journal.',
    icon: FaBook,
    content: [
      'Log trades immediately after execution',
      'Include emotional state and market conditions',
      'Review and analyze trades weekly',
      'Take screenshots of chart setups',
      'Document lessons learned from each trade',
      'Regularly backup your trading data'
    ]
  }
];

const externalResources = [
  {
    title: 'ICT Official YouTube Channel',
    description: 'Free educational content from the Inner Circle Trader',
    url: 'https://www.youtube.com/@InnerCircleTrader',
    category: 'Education'
  },
  {
    title: 'Babypips School of Pipsology',
    description: 'Comprehensive forex trading education for beginners',
    url: 'https://www.babypips.com/learn',
    category: 'Education'
  },
  {
    title: 'TradingView',
    description: 'Professional charting platform and market analysis',
    url: 'https://www.tradingview.com/',
    category: 'Tools'
  },
  {
    title: 'MyFxBook',
    description: 'Trade analysis and portfolio tracking',
    url: 'https://www.myfxbook.com/',
    category: 'Tools'
  }
];

export default function GuidesPage() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Trading Guides & Resources
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Comprehensive guides to help you improve your trading performance and master the art of trading.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-blue-500 dark:hover:bg-blue-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaBook className="w-4 h-4" />
          </button>
          
          <button className="p-3 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-green-500 dark:hover:bg-green-500 text-gray-600 dark:text-gray-400 hover:text-white transition-all duration-200 hover:scale-105">
            <FaExternalLinkAlt className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guides.map((guide) => {
          const IconComponent = guide.icon;
          return (
            <div
              key={guide.id}
              className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
                    <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {guide.description}
                    </p>
                    <ul className="space-y-2">
                      {guide.content.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Tips Section */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
            <FaLightbulb className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quick Trading Tips
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm rounded-xl border border-green-200/50 dark:border-green-800/50">
            <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">📊 Plan Your Trades</h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Always define your entry, stop loss, and take profit levels before entering a trade.
            </p>
          </div>
          <div className="p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-200/50 dark:border-blue-800/50">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">💰 Manage Risk</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Never risk more than 1-2% of your account on a single trade.
            </p>
          </div>
          <div className="p-4 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm rounded-xl border border-purple-200/50 dark:border-purple-800/50">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">📝 Keep Records</h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Document every trade with screenshots, notes, and analysis.
            </p>
          </div>
          <div className="p-4 bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl border border-orange-200/50 dark:border-orange-800/50">
            <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-2">🧠 Control Emotions</h3>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Stick to your trading plan regardless of recent wins or losses.
            </p>
          </div>
          <div className="p-4 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-xl border border-red-200/50 dark:border-red-800/50">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">📈 Focus on Process</h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              Profits are a byproduct of following a good trading process consistently.
            </p>
          </div>
          <div className="p-4 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm rounded-xl border border-indigo-200/50 dark:border-indigo-800/50">
            <h3 className="font-semibold text-indigo-700 dark:text-indigo-300 mb-2">📚 Never Stop Learning</h3>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              Markets evolve constantly. Stay updated with new strategies and concepts.
            </p>
          </div>
        </div>
      </div>

      {/* External Resources */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-xl">
            <FaExternalLinkAlt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            External Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {externalResources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-white/90 dark:hover:bg-gray-800/80 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
            >
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {resource.description}
                </p>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                  {resource.category}
                </span>
              </div>
              <FaExternalLinkAlt className="h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 ml-4 transition-colors" />
            </a>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-xl border border-yellow-200/50 dark:border-yellow-800/50 rounded-2xl p-6 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-yellow-100/80 dark:bg-yellow-900/30 rounded-xl">
            <span className="text-lg">⚠️</span>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Important Disclaimer</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
              Trading involves substantial risk and is not suitable for all investors. Past performance is not indicative of future results. 
              Only trade with money you can afford to lose. The information provided here is for educational purposes only and should not be 
              considered as financial advice. Always do your own research and consider consulting with a qualified financial advisor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 