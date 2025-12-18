'use client';

import React from 'react';
import { FaTrophy, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface Props {
  score: number; // 0-100
  confidence: number; // 0-100
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  alignment: number; // 0-100 (how many concepts align)
}

export default function ICTScoreGauge({ score, confidence, bias, alignment }: Props) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500', label: 'Excellent' };
    if (s >= 60) return { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500', label: 'Good' };
    if (s >= 40) return { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500', label: 'Fair' };
    return { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500', label: 'Poor' };
  };

  const getBiasColor = (b: string) => {
    switch (b) {
      case 'BULLISH':
        return 'text-green-600 dark:text-green-400';
      case 'BEARISH':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const scoreInfo = getScoreColor(score);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const scoreOffset = circumference - (score / 100) * circumference;
  const confidenceOffset = circumference - (confidence / 100) * circumference;
  const alignmentOffset = circumference - (alignment / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-black dark:to-emerald-950/20 rounded-lg shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <FaTrophy className="text-yellow-500 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          ICT Score Analysis
        </h3>
      </div>

      {/* Main Gauge */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          {/* Background circle */}
          <svg className="transform -rotate-90 w-48 h-48">
            <circle
              cx="96"
              cy="96"
              r="65"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-200 dark:text-gray-700"
            />
            {/* Score circle */}
            <circle
              cx="96"
              cy="96"
              r="65"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={scoreOffset}
              strokeLinecap="round"
              className={scoreInfo.bg.replace('bg-', 'text-')}
              style={{
                transition: 'stroke-dashoffset 1s ease-in-out',
              }}
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-bold ${scoreInfo.color}`}>
              {Math.round(score)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              ICT Score
            </div>
            <div className={`text-xs font-medium mt-1 ${scoreInfo.color}`}>
              {scoreInfo.label}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Confidence */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={confidenceOffset}
                strokeLinecap="round"
                className="text-blue-500"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {Math.round(confidence)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Confidence</p>
        </div>

        {/* Bias */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center">
            <div className={`text-3xl font-bold ${getBiasColor(bias)}`}>
              {bias === 'BULLISH' ? '↑' : bias === 'BEARISH' ? '↓' : '→'}
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bias</p>
          <p className={`text-xs font-semibold ${getBiasColor(bias)}`}>
            {bias}
          </p>
        </div>

        {/* Alignment */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={alignmentOffset}
                strokeLinecap="round"
                className="text-purple-500"
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {Math.round(alignment)}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Alignment</p>
        </div>
      </div>

      {/* Score Interpretation */}
      <div className={`p-4 rounded-lg ${
        score >= 80 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
          : score >= 60
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
          : score >= 40
          ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700'
          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
      }`}>
        <div className="flex items-start space-x-2">
          {score >= 60 ? (
            <FaCheckCircle className={scoreInfo.color} />
          ) : (
            <FaExclamationTriangle className={scoreInfo.color} />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              {score >= 80 && 'Strong ICT Setup!'}
              {score >= 60 && score < 80 && 'Valid ICT Setup'}
              {score >= 40 && score < 60 && 'Weak Setup - Use Caution'}
              {score < 40 && 'Poor Setup - Avoid Trade'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {score >= 80 && 'All major ICT concepts align. High probability setup with strong confluence.'}
              {score >= 60 && score < 80 && 'Good alignment of ICT concepts. Monitor for additional confirmation.'}
              {score >= 40 && score < 60 && 'Limited ICT confluence. Consider waiting for better setup.'}
              {score < 40 && 'ICT concepts do not support a trade. Wait for clearer conditions.'}
            </p>
          </div>
        </div>
      </div>

      {/* Concept Alignment Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          Score Components:
        </p>
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>• Base Score (ICT Concepts)</span>
            <span className="font-mono">{Math.round(score * 0.7)}/70</span>
          </div>
          <div className="flex justify-between">
            <span>• Confidence Factor</span>
            <span className="font-mono">{Math.round(confidence * 0.2)}/20</span>
          </div>
          <div className="flex justify-between">
            <span>• Alignment Bonus</span>
            <span className="font-mono">{Math.round(alignment * 0.1)}/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}

