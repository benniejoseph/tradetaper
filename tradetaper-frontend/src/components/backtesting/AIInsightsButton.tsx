'use client';

import React, { useState } from 'react';
import { FaBrain, FaSpinner, FaTimes } from 'react-icons/fa';
import { backtestingService } from '@/services/backtestingService';
import ReactMarkdown from 'react-markdown';

interface AIInsightsButtonProps {
  strategyId: string;
  className?: string;
}

export default function AIInsightsButton({
  strategyId,
  className = '',
}: AIInsightsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setInsights('');
    setError(null);
    setShowModal(true);

    try {
      const stream = backtestingService.streamInsights(strategyId);

      for await (const chunk of stream) {
        setInsights((prev) => prev + chunk);
      }
    } catch (err: any) {
      console.error('Failed to generate insights:', err);
      setError(err.message || 'Failed to generate AI insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setInsights('');
    setError(null);
  };

  return (
    <>
      <button
        onClick={handleGenerateInsights}
        disabled={isLoading}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          bg-purple-500 hover:bg-purple-600
          text-white font-medium rounded-lg
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        type="button"
      >
        <FaBrain className="w-4 h-4" />
        <span>Get AI Insights</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <FaBrain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Strategy Insights
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Powered by Gemini AI
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                  <p className="font-medium">Error generating insights</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : isLoading && insights === '' ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <FaSpinner className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Analyzing your backtest data...
                  </p>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  {insights ? (
                    <ReactMarkdown>{insights}</ReactMarkdown>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 italic">
                      Waiting for insights...
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-center gap-2 mt-4 text-gray-500">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
