'use client';

import React from 'react';
import { AnimatedCard, MetricCard, ProgressCard } from '../ui/AnimatedCard';
import { TraderDiscipline, Badge } from '@/services/disciplineService';

// Level thresholds for XP progress calculation
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000, 15000, 22000, 30000];

// Level titles
const LEVEL_TITLES = [
  'Novice', 'Apprentice', 'Trader', 'Skilled Trader', 'Expert',
  'Master', 'Grandmaster', 'Legend', 'Ascendant', 'Immortal',
  'Divine', 'Enlightened', 'Transcendent', 'Cosmic', 'Eternal'
];

interface DisciplineDashboardProps {
  discipline: TraderDiscipline | null;
  loading?: boolean;
}

export const DisciplineDashboard: React.FC<DisciplineDashboardProps> = ({
  discipline,
  loading = false,
}) => {
  if (loading || !discipline) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate XP progress to next level
  const currentThreshold = LEVEL_THRESHOLDS[discipline.level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[discipline.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpProgress = discipline.xpTotal - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const xpPercentage = (xpProgress / xpNeeded) * 100;

  const title = LEVEL_TITLES[discipline.level - 1] || 'Unknown';

  // Score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Hero Card: Level & XP */}
      <AnimatedCard animate={false} variant="gradient" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Level Circle */}
          <div
            className="relative"
          >
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={2 * Math.PI * 45 * (1 - xpPercentage / 100)}
                style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <span
                className="text-3xl font-bold"
              >
                {discipline.level}
              </span>
              <span className="text-xs opacity-80">LEVEL</span>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2
              className="text-2xl font-bold mb-1"
            >
              {title}
            </h2>
            <p className="text-white/80 mb-3">
              {discipline.xpTotal.toLocaleString()} XP Total
            </p>
            
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${xpPercentage}%` }}
              />
            </div>
            <p className="text-sm text-white/70 mt-1">
              {xpProgress} / {xpNeeded} XP to Level {discipline.level + 1}
            </p>
          </div>

          {/* Streak */}
          <div className="text-center">
            <div className="text-4xl" />
            <div className="text-2xl font-bold">{discipline.currentStreak}</div>
            <div className="text-xs text-white/80">Day Streak</div>
          </div>
        </div>
      </AnimatedCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          animate={false}
          title="Discipline Score"
          value={`${discipline.disciplineScore}%`}
          icon={<span className={getScoreColor(discipline.disciplineScore)}></span>}
          trend={discipline.disciplineScore >= 80 ? 'up' : discipline.disciplineScore >= 60 ? 'neutral' : 'down'}
        />
        <MetricCard
          animate={false}
          title="Approved Trades"
          value={discipline.totalApprovedTrades}
          icon=""
          trend="up"
        />
        <MetricCard
          animate={false}
          title="Executed Trades"
          value={discipline.totalExecutedTrades}
          icon=""
          trend="up"
        />
        <MetricCard
          animate={false}
          title="Rule Violations"
          value={discipline.totalRuleViolations}
          icon=""
          trend={discipline.totalRuleViolations === 0 ? 'up' : 'down'}
        />
      </div>

      {/* Badges */}
      <AnimatedCard animate={false} variant="default" className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Badges Earned
          <span className="text-sm font-normal text-gray-500">
            ({discipline.badges?.length || 0})
          </span>
        </h3>
        
        {discipline.badges && discipline.badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {discipline.badges.map((badge: Badge) => (
              <div
                key={badge.id}
                className="bg-gray-50 dark:bg-black/40 rounded-2xl p-4 text-center border border-gray-100 dark:border-white/5"
              >
                <div className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-wider mb-1">
                  {badge.name}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                  {badge.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Complete trades and maintain discipline to earn badges!</p>
          </div>
        )}
      </AnimatedCard>

      {/* Records */}
      <div className="grid md:grid-cols-2 gap-4">
        <ProgressCard
          title="Best Streak"
          progress={discipline.longestStreak}
          target={30}
          color="bg-orange-500"
        />
        <AnimatedCard animate={false} variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Trade</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {discipline.lastTradeAt
                  ? new Date(discipline.lastTradeAt).toLocaleDateString()
                  : 'No trades yet'}
              </p>
            </div>
            <div className="text-2xl" />
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default DisciplineDashboard;
