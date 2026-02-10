'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Strategy } from '@/types/strategy';
import { AnalysisData, DimensionStats } from '@/types/backtesting';
import { strategiesService } from '@/services/strategiesService';
import { backtestingService } from '@/services/backtestingService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import AIInsightsButton from '@/components/backtesting/AIInsightsButton';
import ExportButton from '@/components/backtesting/ExportButton';
import { FiArrowLeft, FiCheckCircle, FiXCircle, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';

function ContentHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

function RecommendationBadge({ rec }: { rec: 'TRADE' | 'CAUTION' | 'AVOID' | 'MORE_DATA' }) {
  const styles = {
    TRADE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    CAUTION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    AVOID: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    MORE_DATA: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  };
  const icons = {
    TRADE: <FiCheckCircle className="mr-1" />,
    CAUTION: <FiAlertCircle className="mr-1" />,
    AVOID: <FiXCircle className="mr-1" />,
    MORE_DATA: <FiBarChart2 className="mr-1" />,
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[rec]}`}>
      {icons[rec]}
      {rec.replace('_', ' ')}
    </span>
  );
}

function DimensionSection({ 
  title, 
  data, 
  icon 
}: { 
  title: string; 
  data: DimensionStats[]; 
  icon: string;
}) {
  if (data.length === 0) return null;
  
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-black dark:to-gray-950/20 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/30">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-900 dark:text-white capitalize">
                {item.value.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-500">{item.trades} trades</span>
            </div>
            <div className="flex items-center gap-4">
              <div className={`font-bold ${Number(item.winRate) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                {Number(item.winRate).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                PF: {Number(item.profitFactor).toFixed(2)}
              </div>
              <RecommendationBadge rec={item.recommendation} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisContent() {
  const searchParams = useSearchParams();
  const strategyIdFromUrl = searchParams.get('strategyId');

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategyIdFromUrl || '');
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    if (selectedStrategyId) {
      loadAnalysis();
    }
  }, [selectedStrategyId]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategies();
      setStrategies(data);
      if (data.length > 0 && !strategyIdFromUrl) {
        setSelectedStrategyId(data[0].id);
      } else if (strategyIdFromUrl) {
        setSelectedStrategyId(strategyIdFromUrl);
      }
    } catch (err) {
      console.error('Failed to load strategies:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      const data = await backtestingService.getAnalysisData(selectedStrategyId);
      setAnalysis(data);
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setAnalysis(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  // Generate AI Rules based on analysis
  const generateRules = () => {
    if (!analysis) return [];
    const rules: string[] = [];
    
    // Best conditions (TRADE)
    const tradeConditions: string[] = [];
    if (analysis.bestConditions.symbol) {
      tradeConditions.push(`${analysis.bestConditions.symbol.value}`);
    }
    if (analysis.bestConditions.session) {
      tradeConditions.push(`${analysis.bestConditions.session.value.replace(/_/g, ' ')} session`);
    }
    if (analysis.bestConditions.killZone) {
      tradeConditions.push(`${analysis.bestConditions.killZone.value.replace(/_/g, ' ')}`);
    }
    if (analysis.bestConditions.dayOfWeek) {
      tradeConditions.push(`${analysis.bestConditions.dayOfWeek.value}`);
    }
    if (tradeConditions.length > 0) {
      rules.push(`✅ **TRADE:** ${tradeConditions.join(', ')}`);
    }

    // Worst conditions (AVOID)
    const avoidConditions: string[] = [];
    if (analysis.worstConditions.symbol) {
      avoidConditions.push(`${analysis.worstConditions.symbol.value}`);
    }
    if (analysis.worstConditions.session) {
      avoidConditions.push(`${analysis.worstConditions.session.value.replace(/_/g, ' ')} session`);
    }
    if (analysis.worstConditions.killZone) {
      avoidConditions.push(`${analysis.worstConditions.killZone.value.replace(/_/g, ' ')}`);
    }
    if (analysis.worstConditions.dayOfWeek) {
      avoidConditions.push(`on ${analysis.worstConditions.dayOfWeek.value}`);
    }
    if (avoidConditions.length > 0) {
      rules.push(`❌ **AVOID:** ${avoidConditions.join(', ')}`);
    }

    // Rule following insight
    if (analysis.overallStats.ruleFollowingRate < 80) {
      rules.push(`⚠️ **Discipline:** Rule-following rate is ${analysis.overallStats.ruleFollowingRate}%. Consider stricter trade checklist adherence.`);
    }

    // Profit factor rule
    if (analysis.overallStats.profitFactor < 1.5) {
      rules.push(`📊 **Risk/Reward:** Profit factor of ${analysis.overallStats.profitFactor} suggests reviewing position sizing or entry criteria.`);
    }

    return rules;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/backtesting"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <ContentHeader
          title="Strategy Analysis"
          description="AI-generated insights and mechanical trading rules"
        />
      </div>

      {/* Strategy Selector & Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <label className="text-sm text-gray-600 dark:text-gray-400">Strategy:</label>
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className="px-4 py-2 border border-emerald-300 dark:border-emerald-600/30 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white min-w-[200px]"
          >
            {strategies.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
          ))}
          </select>
        </div>

        {/* Action Buttons */}
        {selectedStrategyId && (
          <div className="flex items-center gap-3 ml-auto">
            <AIInsightsButton strategyId={selectedStrategyId} />
            <ExportButton variant="strategy" strategyId={selectedStrategyId} label="Export Report" />
          </div>
        )}
      </div>

      {analysisLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : analysis && analysis.tradeCount > 0 ? (
        <>
          {/* AI-Generated Rules */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-6 border border-amber-200/50 dark:border-amber-700/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              🤖 AI-Generated Trading Rules
            </h2>
            <div className="space-y-3">
              {generateRules().map((rule, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-black rounded-lg text-gray-700 dark:text-gray-300">
                  <span dangerouslySetInnerHTML={{ __html: rule.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
              ))}
              {generateRules().length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">
                  Record more trades to generate meaningful rules
                </p>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-black p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{analysis.tradeCount}</div>
              <div className="text-sm text-gray-500">Total Trades</div>
            </div>
            <div className={`p-4 rounded-lg border text-center ${
              Number(analysis.overallStats.winRate) >= 50 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            }`}>
              <div className={`text-2xl font-bold ${
                Number(analysis.overallStats.winRate) >= 50 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Number(analysis.overallStats.winRate).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Win Rate</div>
            </div>
            <div className={`p-4 rounded-lg border text-center ${
              Number(analysis.overallStats.profitFactor) >= 1.5 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className={`text-2xl font-bold ${
                Number(analysis.overallStats.profitFactor) >= 1.5 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {Number(analysis.overallStats.profitFactor).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Profit Factor</div>
            </div>
            <div className={`p-4 rounded-lg border text-center ${
              Number(analysis.overallStats.expectancy) >= 0 
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
            }`}>
              <div className={`text-2xl font-bold ${
                Number(analysis.overallStats.expectancy) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ${Number(analysis.overallStats.expectancy).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Expectancy</div>
            </div>
          </div>

          {/* Data Range */}
          {analysis.dateRange && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Data from {new Date(analysis.dateRange.start).toLocaleDateString()} to{' '}
              {new Date(analysis.dateRange.end).toLocaleDateString()}
            </div>
          )}

          {/* Dimension Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DimensionSection title="By Symbol" data={analysis.bySymbol} icon="💱" />
            <DimensionSection title="By Session" data={analysis.bySession} icon="🌍" />
            <DimensionSection title="By Timeframe" data={analysis.byTimeframe} icon="⏰" />
            <DimensionSection title="By Kill Zone" data={analysis.byKillZone} icon="🎯" />
            <DimensionSection title="By Day of Week" data={analysis.byDayOfWeek} icon="📅" />
            <DimensionSection title="By Setup Type" data={analysis.bySetup} icon="📈" />
          </div>
        </>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-12 text-center">
          <FiBarChart2 className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Analysis Data
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Record backtest trades to generate AI analysis and mechanical rules
          </p>
          <Link
            href={`/backtesting/new?strategyId=${selectedStrategyId}`}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Record First Trade
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <AnalysisContent />
    </Suspense>
  );
}
