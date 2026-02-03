'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DisciplineDashboard } from '@/components/discipline/DisciplineDashboard';
import { TradeApprovalModal } from '@/components/discipline/TradeApprovalModal';
import { CooldownOverlay } from '@/components/discipline/CooldownOverlay';
import disciplineService, { TraderDiscipline, CooldownSession, TradeApproval } from '@/services/disciplineService';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

// Mock strategies for demo - in production, fetch from API
const DEMO_STRATEGIES = [
  {
    id: '1',
    name: 'ICT London Killzone',
    maxRiskPercent: 1,
    checklist: [
      { id: '1', text: 'Identified daily bias from Asia high/low', order: 1 },
      { id: '2', text: 'Marked key liquidity pools (PDH/PDL/PWH/PWL)', order: 2 },
      { id: '3', text: 'Waiting for London session open', order: 3 },
      { id: '4', text: 'Entry is at FVG or OB after liquidity sweep', order: 4 },
      { id: '5', text: 'Stop loss is beyond structure, not arbitrary', order: 5 },
    ],
  },
  {
    id: '2',
    name: 'Scalp Breakout',
    maxRiskPercent: 0.5,
    checklist: [
      { id: '1', text: 'Price consolidated for 30+ minutes', order: 1 },
      { id: '2', text: 'Volume spike on breakout candle', order: 2 },
      { id: '3', text: 'No major news in next 30 minutes', order: 3 },
      { id: '4', text: 'Risk:Reward is at least 1:2', order: 4 },
    ],
  },
];

export default function DisciplinePage() {
  const [discipline, setDiscipline] = useState<TraderDiscipline | null>(null);
  const [cooldown, setCooldown] = useState<CooldownSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(DEMO_STRATEGIES[0]);
  const [recentApprovals, setRecentApprovals] = useState<TradeApproval[]>([]);

  // Fetch discipline stats and cooldown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, cooldownData, historyData] = await Promise.all([
          disciplineService.getStats(),
          disciplineService.getActiveCooldown(),
          disciplineService.getApprovalHistory(),
        ]);
        setDiscipline(statsData);
        setCooldown(cooldownData);
        setRecentApprovals(historyData.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch discipline data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprovalComplete = (approval: TradeApproval) => {
    setRecentApprovals((prev) => [approval, ...prev.slice(0, 4)]);
    // Refresh stats
    disciplineService.getStats().then(setDiscipline);
  };

  const handleCooldownComplete = () => {
    setCooldown(null);
    disciplineService.getStats().then(setDiscipline);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      {/* Cooldown Overlay (blocks trading if active) */}
      {cooldown && !cooldown.isCompleted && !cooldown.isSkipped && (
        <CooldownOverlay
          cooldown={cooldown}
          onComplete={handleCooldownComplete}
          onSkip={() => setCooldown(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎮 Trade Discipline
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete checklists, earn XP, and trade with discipline
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowApprovalModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25"
          >
            🎯 Request Trade Approval
          </motion.button>
        </motion.div>

        {/* Dashboard */}
        <DisciplineDashboard discipline={discipline} loading={loading} />

        {/* Recent Approvals */}
        <AnimatedCard variant="default" className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            📋 Recent Trade Approvals
          </h3>
          
          {recentApprovals.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentApprovals.map((approval, index) => (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      approval.status === 'executed' ? 'bg-emerald-500' :
                      approval.status === 'approved' ? 'bg-yellow-500' :
                      approval.status === 'expired' ? 'bg-gray-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {approval.symbol}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        approval.direction === 'Long' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {approval.direction}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </div>
                    <div className={`text-xs font-medium ${
                      approval.status === 'executed' ? 'text-emerald-500' :
                      approval.status === 'approved' ? 'text-yellow-500' :
                      'text-gray-500'
                    }`}>
                      {approval.status.toUpperCase()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No trade approvals yet. Start by requesting a trade approval!</p>
            </div>
          )}
        </AnimatedCard>

        {/* Strategy Selector */}
        <AnimatedCard variant="glass" className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            📋 Select Strategy for Next Trade
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {DEMO_STRATEGIES.map((strategy) => (
              <motion.button
                key={strategy.id}
                onClick={() => setSelectedStrategy(strategy)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl text-left transition-all border-2 ${
                  selectedStrategy.id === strategy.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {strategy.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {strategy.checklist.length} checklist items • Max {strategy.maxRiskPercent}% risk
                </div>
              </motion.button>
            ))}
          </div>
        </AnimatedCard>
      </div>

      {/* Approval Modal */}
      <TradeApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        strategy={selectedStrategy}
        accountBalance={10000}
        onApproved={handleApprovalComplete}
      />
    </div>
  );
}
