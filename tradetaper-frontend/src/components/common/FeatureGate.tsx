import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaLock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export type GateFeature =
  | 'discipline'
  | 'aiAnalysis'
  | 'chartAnalysis'
  | 'backtesting'
  | 'advancedAnalytics'
  | 'psychology'
  | 'mentor'
  | 'reports'
  | 'community';

interface FeatureGateProps {
  feature: GateFeature;
  children: React.ReactNode;
  blur?: boolean;
  className?: string;
}

const GATE_COPY: Record<GateFeature, { title: string; description: string; requiredPlan: string }> = {
  discipline: {
    title: 'Trader Discipline Locked',
    description: 'Track your rules, streaks, and mindset patterns. Upgrade to Essential or Premium.',
    requiredPlan: 'Essential',
  },
  aiAnalysis: {
    title: 'AI Analysis Locked',
    description: 'Get Gemini-powered trade analysis and chart insights. Upgrade to Premium.',
    requiredPlan: 'Premium',
  },
  chartAnalysis: {
    title: 'Live Chart Analysis Locked',
    description: 'Analyze live charts with AI-powered pattern recognition. Upgrade to Premium.',
    requiredPlan: 'Premium',
  },
  backtesting: {
    title: 'Advanced Backtesting Locked',
    description: 'Run full strategy backtests and pattern discovery. Upgrade to Premium.',
    requiredPlan: 'Premium',
  },
  advancedAnalytics: {
    title: 'Advanced Analytics Locked',
    description: 'Access deep performance, session, and risk analytics. Upgrade to Essential or Premium.',
    requiredPlan: 'Essential',
  },
  psychology: {
    title: 'Psychology Insights Locked',
    description: 'AI-powered psychological profiling and emotional bias detection. Upgrade to Premium.',
    requiredPlan: 'Premium',
  },
  mentor: {
    title: 'ICT Mentor AI Locked',
    description: 'Your personal AI trading mentor powered by your own knowledge base. Upgrade to Premium.',
    requiredPlan: 'Premium',
  },
  reports: {
    title: 'Reports Locked',
    description: 'Weekly and monthly automated performance reports. Upgrade to Premium.',
    requiredPlan: 'Premium',
  },
  community: {
    title: 'Community Locked',
    description: 'Connect with disciplined traders, share setups, and join leaderboards. Upgrade to Essential or Premium.',
    requiredPlan: 'Essential',
  },
};

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, blur = true, className = '' }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  const planDetails = user?.subscription?.planDetails || null;
  const limits: Record<string, any> = planDetails?.limits || {};
  const planId = user?.subscription?.plan || 'free';

  let hasAccess = false;

  switch (feature) {
    case 'discipline':
      hasAccess = !!limits.discipline;
      break;
    case 'aiAnalysis':
    case 'chartAnalysis':
    case 'mentor':
      hasAccess = !!limits.aiAnalysis;
      break;
    case 'backtesting':
      hasAccess = limits.backtesting === 'full';
      break;
    case 'advancedAnalytics':
      hasAccess = planId === 'essential' || planId === 'premium' || !!limits.reports;
      break;
    case 'psychology':
      hasAccess = !!limits.psychology;
      break;
    case 'reports':
      hasAccess = !!limits.reports;
      break;
    case 'community':
      // Essential and Premium can participate; Free can read-only (we still allow rendering but gate actions outside)
      hasAccess = planId === 'essential' || planId === 'premium';
      break;
    default:
      hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const copy = GATE_COPY[feature];

  return (
    <div className={`relative w-full h-full min-h-[200px] flex items-center justify-center ${className}`}>
      <div className={blur ? "absolute inset-0 filter blur-md pointer-events-none select-none bg-white/50 dark:bg-black/50 transition-all duration-300 z-0" : "absolute inset-0 z-0"}>
        {children}
      </div>
      
      <div className="relative z-10 p-6 w-full max-w-lg mx-auto text-center">
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/20 dark:border-zinc-700/50 rounded-3xl p-8 shadow-2xl shadow-black/20 transform hover:scale-[1.02] transition-all duration-300">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 rotate-3">
            <FaLock className="text-white text-2xl" />
          </div>
          
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full px-3 py-1 mb-4">
            {copy.requiredPlan} Plan Required
          </div>

          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {copy.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium text-sm leading-relaxed">
            {copy.description}
          </p>
          
          <button
            onClick={() => router.push('/plans')}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
          >
            Upgrade to {copy.requiredPlan}
          </button>
        </div>
      </div>
    </div>
  );
};

