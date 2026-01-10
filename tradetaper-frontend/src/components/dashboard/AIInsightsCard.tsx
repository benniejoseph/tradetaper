"use client";
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { FaRobot, FaCheckCircle, FaExclamationTriangle, FaLightbulb, FaSpinner } from 'react-icons/fa';
import { AnimatedCard } from '@/components/ui/AnimatedCard';

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

export default function AIInsightsCard() {
  const { token } = useSelector((state: RootState) => state.auth);
  const [report, setReport] = useState<AIReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
        fetchInsights();
    }
  }, [token]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/insights`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            setReport(data);
        }
    } catch (e) {
        console.error("Failed to fetch AI insights", e);
    } finally {
        setLoading(false);
    }
  };

  if (!report && !loading) return null;

  return (
    <div className="col-span-1 sm:col-span-2 lg:col-span-6 bg-white dark:bg-[#022c22] border border-slate-200 dark:border-emerald-900 rounded-xl shadow-sm p-0 overflow-hidden">
      {/* Header / Main Score Area - Emerald Gradient matching request */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-600 p-6 text-white flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
               <div className="p-3 bg-white/10 rounded-full backdrop-blur-sm">
                  <FaRobot className="w-8 h-8 text-emerald-50" />
               </div>
               <div>
                   <h3 className="text-2xl font-bold text-white">Trading Coach Insight</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-50 text-sm opacity-80">AI-Powered Analysis</span>
                      {loading && <FaSpinner className="animate-spin text-white" />}
                   </div>
               </div>
          </div>
          <div className="text-right mt-4 md:mt-0">
             <div className="text-5xl font-black">{report?.traderScore || 0}</div>
             <div className="text-xs uppercase tracking-widest opacity-60">Trader Score</div>
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
                <h4 className="text-slate-900 dark:text-white font-semibold text-xs mb-1 line-clamp-1">{insight.title}</h4>
                <p className="text-slate-600 dark:text-emerald-200/70 text-[11px] leading-tight mb-2 line-clamp-3">{insight.description}</p>
                {insight.actionableStep && (
                   <div className="bg-white dark:bg-emerald-950/50 rounded p-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50">
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
