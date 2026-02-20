"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaRobot, FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaSpinner, FaRedo } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { formatDistanceToNow } from 'date-fns';
import { Trade } from '@/types/trade';

interface Insight {
  type: 'STRENGTH' | 'WEAKNESS' | 'FOCUS_AREA';
  title: string;
  description: string;
  actionableStep?: string;
}

interface AIReport {
  traderScore: number;
  scoreReasoning: string;
  insights: Insight[];
}

interface CachedReport {
    data: AIReport;
    timestamp: number;
}

export default function AIInsightsCard() {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const { trades } = useSelector((state: RootState) => state.trades);
  
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // robustly determine the latest trade date
  const latestTradeDate = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    
    // Sort trades by exit date or entry date to find the latest
    const sorted = [...trades].sort((a, b) => {
        const dateA = new Date(a.exitDate || a.entryDate || 0).getTime();
        const dateB = new Date(b.exitDate || b.entryDate || 0).getTime();
        return dateB - dateA; // Descending
    });
    
    const latest = sorted[0];
    return latest ? new Date(latest.exitDate || latest.entryDate || 0).getTime() : null;
  }, [trades]);

  const cacheKey = useMemo(() => user ? `trading_coach_report_${user.id}` : null, [user]);

  // Load from cache on mount
  useEffect(() => {
    if (cacheKey) {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
            try {
                const cached: CachedReport = JSON.parse(cachedStr);
                setReport(cached.data);
                setLastUpdated(cached.timestamp);
            } catch (e) {
                console.error("Failed to parse cached insights", e);
                localStorage.removeItem(cacheKey);
            }
        }
    }
  }, [cacheKey]);

  // Fetch logic (Initial or Auto-Refresh)
  useEffect(() => {
    if (!token || !cacheKey) return;

    const checkAndFetch = async () => {
        const cachedStr = localStorage.getItem(cacheKey);
        let shouldFetch = false;

        if (!cachedStr) {
            // No cache, fetch immediately
            shouldFetch = true;
        } else {
            // Check Smart Refresh Logic
            try {
                const cached: CachedReport = JSON.parse(cachedStr);
                const ONE_DAY_MS = 24 * 60 * 60 * 1000;
                const isCacheOld = (Date.now() - cached.timestamp) > ONE_DAY_MS;
                
                // If cache is old AND we have a newer trade
                if (isCacheOld && latestTradeDate) {
                    if (latestTradeDate > cached.timestamp) {
                       console.log("Auto-refreshing Trading Coach: Cache invalid and new trades detected.");
                       shouldFetch = true;
                    }
                }
            } catch {
                shouldFetch = true;
            }
        }

        if (shouldFetch && !loading) {
            fetchInsights();
        }
    };

    checkAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, cacheKey, latestTradeDate]); // Intentionally not including 'loading' to avoid loops

  const fetchInsights = async () => {
    if (loading) return;
    setLoading(true);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setReport(data);
            
            const now = Date.now();
            setLastUpdated(now);
            
            if (cacheKey) {
                const cacheData: CachedReport = { data, timestamp: now };
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            }
        }
    } catch (e) {
        console.error("Failed to fetch AI insights", e);
    } finally {
        setLoading(false);
    }
  };

  const handleManualRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchInsights();
  };

  if (!report && !loading) return null;

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-6 bg-white dark:bg-[#022c22] border border-slate-200 dark:border-emerald-900 rounded-xl shadow-sm p-0 overflow-hidden">
      {/* Header / Main Score Area - Emerald Gradient matching request */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-600 p-4 text-white flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3">
               <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
                  <FaRobot className="w-6 h-6 text-emerald-50" />
               </div>
               <div>
                   <h3 className="text-xl font-bold text-white">Trading Coach Insight</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-50 text-sm opacity-80">AI-Powered Analysis</span>
                      {loading && <FaSpinner className="animate-spin text-white" />}
                      {!loading && lastUpdated && (
                          <span className="text-emerald-100/60 text-xs border-l border-emerald-500/50 pl-2 ml-1">
                              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                          </span>
                      )}
                   </div>
               </div>
          </div>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
             <div className="text-right">
                <div className="text-3xl font-black">{report?.traderScore || 0}</div>
                <div className="text-[10px] uppercase tracking-widest opacity-60">Trader Score</div>
             </div>
             
             {/* Refresh Button */}
             <button 
                onClick={handleManualRefresh}
                disabled={loading}
                className={`p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/80 hover:text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh Analysis"
             >
                <FaRedo className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
             </button>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Main Reasoning */}
         <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-emerald-900/50 pb-4 md:pb-0 md:pr-6">
             <h4 className="text-sm font-semibold text-slate-500 dark:text-emerald-400 uppercase tracking-wider mb-3">Overall Assessment</h4>
             <p className="text-slate-700 dark:text-emerald-100 leading-relaxed text-sm">
               {report?.scoreReasoning || "Analyzing your recent trading history..."}
             </p>
         </div>

        {/* Insights Grid */}
        <div className="md:w-2/3 grid gap-3 grid-cols-1 md:grid-cols-3">
           {report?.insights.map((insight, idx) => (
             <div key={idx} className="bg-slate-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-slate-200 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 mb-2">
                   {insight.type === 'STRENGTH' && <FaCheckCircle className="text-emerald-500" />}
                   {insight.type === 'WEAKNESS' && <FaExclamationTriangle className="text-rose-500" />}
                   {insight.type === 'FOCUS_AREA' && <FaLightbulb className="text-amber-500" />}
                   <span className="text-[10px] font-bold text-slate-500 dark:text-emerald-400 tracking-wider uppercase">
                      {insight.type.replace('_', ' ')}
                   </span>
                </div>
                <h4 className="text-slate-900 dark:text-white font-semibold text-xs mb-1">{insight.title}</h4>
                <p className="text-slate-600 dark:text-emerald-200/70 text-xs leading-relaxed mb-2">{insight.description}</p>
                {insight.actionableStep && (
                   <div className="bg-white dark:bg-emerald-950/50 rounded p-2 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
                      <strong>Do this:</strong> {insight.actionableStep}
                   </div>
                )}
             </div>
           ))}
           
           {!report && loading && (
               [1,2,3].map(i => (
                 <div key={i} className="animate-pulse bg-slate-100 dark:bg-emerald-900/20 h-24 rounded-lg"></div>
               ))
           )}
        </div>
      </div>
    </div>
  );
}
