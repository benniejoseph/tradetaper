'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DisciplineDashboard } from '@/components/discipline/DisciplineDashboard';
import { TradeApprovalModal } from '@/components/discipline/TradeApprovalModal';
import { CooldownOverlay } from '@/components/discipline/CooldownOverlay';
import disciplineService, { TraderDiscipline, CooldownSession, TradeApproval } from '@/services/disciplineService';
import { strategiesService } from '@/services/strategiesService';
import { Strategy } from '@/types/strategy';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchMT5Accounts, selectMT5Accounts } from '@/store/features/mt5AccountsSlice';

export default function DisciplinePage() {
  const dispatch = useDispatch<AppDispatch>();
  const [discipline, setDiscipline] = useState<TraderDiscipline | null>(null);
  const [cooldown, setCooldown] = useState<CooldownSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<TradeApproval[]>([]);
  
  const mt5Accounts = useSelector(selectMT5Accounts);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, cooldownData, historyData, strategiesData] = await Promise.all([
          disciplineService.getStats(),
          disciplineService.getActiveCooldown(),
          disciplineService.getApprovalHistory(),
          strategiesService.getStrategies(),
        ]);
        setDiscipline(statsData);
        setCooldown(cooldownData);
        setRecentApprovals(historyData.slice(0, 5));
        setStrategies(strategiesData);
        
        // Ensure accounts are loaded
        dispatch(fetchMT5Accounts());
      } catch (err) {
        console.error('Failed to fetch discipline data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch]);

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
      {/* Cooldown Overlay */}
      {cooldown && !cooldown.isCompleted && !cooldown.isSkipped && (
        <CooldownOverlay
          cooldown={cooldown}
          onComplete={handleCooldownComplete}
          onSkip={() => setCooldown(null)}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Trade Discipline
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Maintain professional standards and earn discipline rewards
            </p>
          </div>
          
          <button
            onClick={() => setShowApprovalModal(true)}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
          >
            Execute Trade
          </button>
        </div>

        {/* Dashboard Stats */}
        <DisciplineDashboard discipline={discipline} loading={loading} />

        {/* Recent Trade History */}
        <AnimatedCard animate={false} variant="default" className="space-y-4 border-0 shadow-xl bg-white dark:bg-black/40">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Recent Approvals
          </h3>
          
          {recentApprovals.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {recentApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="py-4 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-1.5 h-8 rounded-full ${
                      approval.status === 'executed' ? 'bg-emerald-500' :
                      approval.status === 'approved' ? 'bg-yellow-500' :
                      approval.status === 'expired' ? 'bg-gray-500' :
                      'bg-red-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 dark:text-white uppercase tracking-wider">
                          {approval.symbol}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                          approval.direction === 'Long' 
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {approval.direction}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                        {new Date(approval.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black uppercase tracking-widest ${
                      approval.status === 'executed' ? 'text-emerald-500' :
                      approval.status === 'approved' ? 'text-yellow-500' :
                      'text-gray-500'
                    }`}>
                      {approval.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm font-medium italic">No execution history found.</p>
            </div>
          )}
        </AnimatedCard>

        {/* Active Strategies Quick View */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <h3 className="md:col-span-2 lg:col-span-3 text-xs font-black text-gray-400 uppercase tracking-widest mt-4">Available Strategies</h3>
          {strategies.filter(s => s.isActive).length > 0 ? (
            strategies.filter(s => s.isActive).map((strategy) => (
              <div
                key={strategy.id}
                className="p-6 rounded-3xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-wide">
                    {strategy.name}
                  </h4>
                  <div className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black">
                    ACTIVE
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider flex flex-col gap-1">
                  <span>{strategy.checklist?.length || 0} Rule Configuration</span>
                  <span>MT5 Sync Ready</span>
                </div>
              </div>
            ))
          ) : (
             <div className="md:col-span-2 lg:col-span-3 text-center py-8">
              <p className="text-gray-500 italic">No active strategies configured.</p>
            </div>
          )}
        </div>
      </div>

      {/* Execute Trade Modal */}
      <TradeApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        accounts={mt5Accounts}
        onApproved={handleApprovalComplete}
      />
    </div>
  );
}
