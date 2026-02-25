import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaLock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface FeatureGateProps {
  feature: 'discipline' | 'aiAnalysis' | 'chartAnalysis' | 'backtesting' | 'advancedAnalytics';
  children: React.ReactNode;
  blur?: boolean;
  className?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, blur = true, className = '' }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  // If no subscription info, assume free plan/restricted
  // We handle the case where subscription might not be loaded yet by defaulting to empty limits
  // In a real app we might want a 'loading' state check here too, but failing closed is safer
  const planDetails = user?.subscription?.planDetails || null;
  const limits: Record<string, any> = planDetails?.limits || {};

  let hasAccess = false;

  switch (feature) {
    case 'discipline':
      hasAccess = !!limits.discipline;
      break;
    case 'aiAnalysis':
      hasAccess = !!limits.aiAnalysis;
      break;
    case 'chartAnalysis':
      // Assuming chart analysis is tied to AI Analysis
      hasAccess = !!limits.aiAnalysis; 
      break;
    case 'backtesting':
      // 'full' access required for advanced backtesting features
      hasAccess = limits.backtesting === 'full';
      break;
    case 'advancedAnalytics':
      // Explicitly allow 'essential' and 'premium' plans
      // Also fallback to limits.reports if strictly defined there
      const planId = user?.subscription?.plan;
      hasAccess = planId === 'essential' || planId === 'premium' || !!limits.reports;
      break;
    default:
      hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // If no access
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
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {feature === 'discipline' ? 'Trader Mind Locked' : 'Unlock Advanced Analytics'}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 font-medium text-sm leading-relaxed">
                {feature === 'discipline' 
                  ? 'Master your trading psychology with Trader Mind. Upgrade to Essential or Premium to unlock.'
                  : `Gain deeper insights with ${feature === 'aiAnalysis' ? 'AI Analysis' : 'Advanced Analytics'}. Analyze performance, session breakdowns, and more.`
                }
            </p>
            
            <button
                onClick={() => router.push('/pricing')}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
            >
                Upgrade Plan
            </button>
        </div>
      </div>
    </div>
  );
};
