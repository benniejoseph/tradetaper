"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FeatureGate } from '@/components/common/FeatureGate';
import {
  reportsService,
  WeeklyReport,
  WeeklyReportAiSummary,
} from '@/services/reportsService';
import {
  FaEnvelope,
  FaHistory,
  FaExclamationTriangle,
  FaSync,
  FaChartLine,
  FaBalanceScale,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSigned = (value: number, digits = 2): string => {
  const rounded = Number(value.toFixed(digits));
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
};

const formatPercent = (value: number, digits = 1): string =>
  `${value.toFixed(digits)}%`;

const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

type ReportsTab = 'report' | 'history';

interface ParsedWeeklyMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
  expectancy: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
}

interface DiagnosticRow {
  title: string;
  score: number;
  signal: 'strong' | 'watch' | 'critical';
  detail: string;
}

const parseMetrics = (report?: WeeklyReport | null): ParsedWeeklyMetrics => {
  if (!report) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      netPnl: 0,
      expectancy: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
    };
  }

  return {
    totalTrades: toNumber(report.totalTrades),
    winningTrades: toNumber(report.winningTrades),
    losingTrades: toNumber(report.losingTrades),
    winRate: toNumber(report.winRate),
    netPnl: toNumber(report.netPnl),
    expectancy: toNumber(report.expectancy),
    profitFactor: toNumber(report.profitFactor),
    averageWin: toNumber(report.averageWin),
    averageLoss: toNumber(report.averageLoss),
  };
};

const resolveSignal = (score: number): DiagnosticRow['signal'] => {
  if (score >= 75) return 'strong';
  if (score >= 50) return 'watch';
  return 'critical';
};

const buildDiagnostics = (
  metrics: ParsedWeeklyMetrics,
  riskAlertCount: number,
): DiagnosticRow[] => {
  const averageLossAbs = Math.abs(metrics.averageLoss);
  const payoffRatio = averageLossAbs > 0 ? metrics.averageWin / averageLossAbs : 0;

  const executionScore = Math.round(
    clamp(
      metrics.winRate * 0.45 +
        clamp(metrics.profitFactor, 0, 2) * 20 +
        (metrics.expectancy > 0 ? 20 : 0),
      0,
      100,
    ),
  );

  const riskScore = Math.round(
    clamp(
      (metrics.profitFactor >= 1 ? 48 : 24) +
        clamp(payoffRatio, 0, 2) * 24 +
        clamp(28 - riskAlertCount * 6, 8, 28),
      0,
      100,
    ),
  );

  const consistencyScore = Math.round(
    clamp(
      (metrics.totalTrades > 0
        ? (1 - Math.abs(metrics.winRate - 50) / 50) * 44
        : 0) +
        clamp(metrics.totalTrades, 0, 25) * 1.4 +
        (metrics.netPnl >= 0 ? 24 : 12),
      0,
      100,
    ),
  );

  const recoveryScore = Math.round(
    clamp(
      (metrics.netPnl >= 0 ? 58 : 30) +
        (metrics.expectancy > 0 ? 20 : 8) +
        (metrics.profitFactor >= 1 ? 22 : 10),
      0,
      100,
    ),
  );

  return [
    {
      title: 'Execution Quality',
      score: executionScore,
      signal: resolveSignal(executionScore),
      detail:
        metrics.winRate >= 50
          ? 'Entry selection quality is stable; keep preserving A-setups.'
          : 'Hit-rate is under pressure; tighten setup qualification criteria.',
    },
    {
      title: 'Risk Architecture',
      score: riskScore,
      signal: resolveSignal(riskScore),
      detail:
        payoffRatio >= 1
          ? 'Payoff structure supports growth when discipline holds.'
          : 'Average loss outweighs reward; harden stop discipline and sizing.',
    },
    {
      title: 'Process Consistency',
      score: consistencyScore,
      signal: resolveSignal(consistencyScore),
      detail:
        metrics.totalTrades >= 10
          ? 'Sample size is sufficient for weekly process evaluation.'
          : 'Low sample week; avoid overfitting and focus on repeatability.',
    },
    {
      title: 'Recovery Trajectory',
      score: recoveryScore,
      signal: resolveSignal(recoveryScore),
      detail:
        metrics.netPnl >= 0
          ? 'Equity curve is resilient; prioritize controlled compounding.'
          : 'Recovery possible, but requires strict drawdown containment.',
    },
  ];
};

const emptyAiSummary: WeeklyReportAiSummary = {
  executiveSummary: 'No AI summary was generated for this report.',
  strengths: [],
  weaknesses: [],
  improvementPlan: [],
  bestSetup: '',
  worstPattern: '',
  riskAlerts: [],
  confidence: 0,
};

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const reportIdFromQuery = searchParams.get('reportId');

  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [activeTab, setActiveTab] = useState<ReportsTab>('report');
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchReports = async () => {
    setListLoading(true);
    setError(null);
    try {
      const response = await reportsService.listReports(1, 20);
      setReports(response.data || []);

      const nextSelectedId =
        reportIdFromQuery || response.data?.[0]?.id || selectedReportId || null;
      setSelectedReportId(nextSelectedId);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load weekly reports.';
      setError(message);
    } finally {
      setListLoading(false);
    }
  };

  const fetchReportDetail = async (reportId: string) => {
    setDetailLoading(true);
    setError(null);
    try {
      const report = await reportsService.getReport(reportId);
      setSelectedReport(report);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load report details.';
      setError(message);
      setSelectedReport(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    void fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedReportId) {
      setSelectedReport(null);
      return;
    }
    void fetchReportDetail(selectedReportId);
  }, [selectedReportId]);

  useEffect(() => {
    if (!reportIdFromQuery) return;
    setSelectedReportId(reportIdFromQuery);
    setActiveTab('report');
  }, [reportIdFromQuery]);

  const selectedAiSummary = useMemo(() => {
    return selectedReport?.aiSummary || emptyAiSummary;
  }, [selectedReport]);

  const selectedMetrics = useMemo(
    () => parseMetrics(selectedReport),
    [selectedReport],
  );

  const previousReport = useMemo(() => {
    if (!selectedReportId) return null;
    const selectedIndex = reports.findIndex((item) => item.id === selectedReportId);
    if (selectedIndex === -1) return null;
    return reports[selectedIndex + 1] || null;
  }, [reports, selectedReportId]);

  const previousMetrics = useMemo(
    () => parseMetrics(previousReport),
    [previousReport],
  );

  const diagnostics = useMemo(
    () => buildDiagnostics(selectedMetrics, selectedAiSummary.riskAlerts.length),
    [selectedMetrics, selectedAiSummary.riskAlerts.length],
  );

  const handleGenerateLatest = async () => {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const generated = await reportsService.generateLatestReport();
      setActionMessage('Latest weekly report generated.');
      await fetchReports();
      setSelectedReportId(generated.id);
      setActiveTab('report');
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Failed to generate report.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await reportsService.resendReportEmail(selectedReport.id);
      setActionMessage('Weekly report email queued.');
      await fetchReportDetail(selectedReport.id);
    } catch (requestError: unknown) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Failed to resend report email.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <FeatureGate feature="reports" className="min-h-screen">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 sm:px-6 sm:py-6">
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-4 dark:border-emerald-600/25 dark:from-emerald-950/25 dark:via-black dark:to-black sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 sm:text-3xl">
                Weekly AI Reports
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                Review execution patterns, process leaks, and next-week action
                plans.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateLatest}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-200 dark:hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaSync className={actionLoading ? 'animate-spin' : ''} />
                Generate Latest
              </button>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={!selectedReport || actionLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FaEnvelope />
                Resend Email
              </button>
            </div>
          </div>

          {(error || actionMessage) && (
            <div
              className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
                error
                  ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
            >
              {error || actionMessage}
            </div>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                activeTab === 'report'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-200'
              }`}
            >
              <FaChartLine />
              Report View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                activeTab === 'history'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-200'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:border-emerald-500/50 dark:hover:text-emerald-200'
              }`}
            >
              <FaHistory />
              Recent History
            </button>
          </div>

          {activeTab === 'history' ? (
            <section className="rounded-2xl border border-gray-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-black/70 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                    Recent Weekly Reports
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                    Open any cycle to review full diagnostics and action blueprint.
                  </p>
                </div>
              </div>

              {listLoading ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900/70"
                    />
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                  No weekly reports yet. Generate your latest report to start your review cycle.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {reports.map((report) => {
                    const isSelected = selectedReportId === report.id;
                    const reportNetPnl = toNumber(report.netPnl);
                    return (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => {
                          setActionMessage(null);
                          setSelectedReportId(report.id);
                          setActiveTab('report');
                        }}
                        className={`rounded-xl border px-4 py-4 text-left transition ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/60 dark:bg-emerald-500/10'
                            : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-emerald-500/40 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                          {report.weekLabel}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          Generated {formatDateTime(report.aiGeneratedAt)}
                        </p>
                        <p
                          className={`mt-3 text-xl font-semibold ${
                            reportNetPnl >= 0
                              ? 'text-emerald-600 dark:text-emerald-300'
                              : 'text-red-600 dark:text-red-300'
                          }`}
                        >
                          {formatSigned(reportNetPnl)}
                        </p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-zinc-400">
                          {toNumber(report.totalTrades)} trades •{' '}
                          {formatPercent(toNumber(report.winRate))}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-gray-200 bg-white/85 p-4 dark:border-zinc-800 dark:bg-black/70 sm:p-5">
              {!selectedReportId ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                  Select a weekly report to view full analysis.
                </div>
              ) : detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900/70"
                    />
                  ))}
                </div>
              ) : !selectedReport ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                  Report details are unavailable.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100">
                          {selectedReport.weekLabel}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                          Generated: {formatDateTime(selectedReport.aiGeneratedAt)}
                          {' • '}
                          Last email: {formatDateTime(selectedReport.emailedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:border-emerald-500/50 dark:hover:text-emerald-200"
                      >
                        <FaHistory />
                        Open History
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                      <MetricCard
                        label="Net P&L"
                        value={formatSigned(selectedMetrics.netPnl)}
                        positive={selectedMetrics.netPnl >= 0}
                      />
                      <MetricCard
                        label="Win Rate"
                        value={formatPercent(selectedMetrics.winRate)}
                      />
                      <MetricCard
                        label="Trades"
                        value={String(selectedMetrics.totalTrades)}
                      />
                      <MetricCard
                        label="Expectancy"
                        value={formatSigned(selectedMetrics.expectancy)}
                        positive={selectedMetrics.expectancy >= 0}
                      />
                      <MetricCard
                        label="Profit Factor"
                        value={selectedMetrics.profitFactor.toFixed(2)}
                      />
                      <MetricCard
                        label="AI Confidence"
                        value={`${Math.round(selectedAiSummary.confidence)}%`}
                      />
                    </div>

                    {previousReport && (
                      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-black/50">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-zinc-400">
                          Week-over-week drift vs {previousReport.weekLabel}
                        </p>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <DeltaStat
                            label="Net P&L"
                            current={selectedMetrics.netPnl}
                            previous={previousMetrics.netPnl}
                          />
                          <DeltaStat
                            label="Win Rate"
                            current={selectedMetrics.winRate}
                            previous={previousMetrics.winRate}
                            isPercent
                          />
                          <DeltaStat
                            label="Profit Factor"
                            current={selectedMetrics.profitFactor}
                            previous={previousMetrics.profitFactor}
                            digits={2}
                          />
                          <DeltaStat
                            label="Expectancy"
                            current={selectedMetrics.expectancy}
                            previous={previousMetrics.expectancy}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Exclusive Performance Intelligence
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-zinc-200">
                      This readout combines outcome quality, risk architecture, and process stability to
                      produce an institutional-style weekly decision brief.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {diagnostics.map((item) => (
                        <DiagnosticCard key={item.title} item={item} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Executive Summary
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-zinc-200">
                      {selectedAiSummary.executiveSummary || 'No executive summary available.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <InsightList
                      title="Strengths"
                      items={selectedAiSummary.strengths}
                      emptyText="No strengths identified."
                    />
                    <InsightList
                      title="Weaknesses"
                      items={selectedAiSummary.weaknesses}
                      emptyText="No weaknesses identified."
                    />
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                      Institutional Action Blueprint
                    </h3>
                    {selectedAiSummary.improvementPlan.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                        No improvement plan was generated.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {selectedAiSummary.improvementPlan.map((item, index) => (
                          <div
                            key={`${item.action}-${index}`}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-black/50"
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                              {item.action}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">
                              Target: {item.target}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-zinc-500">
                              Horizon: {item.timeHorizon || 'Next 5 trading sessions'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <TradeSnapshotCard
                      title="Best Execution Snapshot"
                      trade={selectedReport.bestTrade || null}
                      positive
                    />
                    <TradeSnapshotCard
                      title="Worst Execution Snapshot"
                      trade={selectedReport.worstTrade || null}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-zinc-200">
                        Best Setup
                      </h3>
                      <p className="mt-2 text-sm text-gray-700 dark:text-zinc-200">
                        {selectedAiSummary.bestSetup || 'No setup highlight available.'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                        Worst Pattern
                      </h3>
                      <p className="mt-2 text-sm text-gray-700 dark:text-zinc-200">
                        {selectedAiSummary.worstPattern || 'No recurring pattern detected.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-zinc-200">
                        Top Symbols
                      </h3>
                      {(selectedReport.symbolBreakdown || []).length === 0 ? (
                        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                          No symbol breakdown available.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {(selectedReport.symbolBreakdown || []).map((row) => (
                            <div
                              key={row.symbol}
                              className="grid grid-cols-[1fr,auto,auto] gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-black/50"
                            >
                              <span className="font-medium text-gray-900 dark:text-zinc-100">
                                {row.symbol}
                              </span>
                              <span className="text-gray-600 dark:text-zinc-300">
                                {row.trades} trades
                              </span>
                              <span
                                className={
                                  toNumber(row.netPnl) >= 0
                                    ? 'text-emerald-600 dark:text-emerald-300'
                                    : 'text-red-600 dark:text-red-300'
                                }
                              >
                                {formatSigned(toNumber(row.netPnl))}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-zinc-200">
                        Risk Alerts
                      </h3>
                      {selectedAiSummary.riskAlerts.length === 0 ? (
                        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                          No risk alerts identified.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {selectedAiSummary.riskAlerts.map((alert, index) => (
                            <div
                              key={`${alert}-${index}`}
                              className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-200"
                            >
                              <FaExclamationTriangle className="mt-0.5 shrink-0" />
                              <span>{alert}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </FeatureGate>
  );
}

function MetricCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-800 dark:bg-black/50">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-base font-semibold ${
          positive === undefined
            ? 'text-gray-900 dark:text-zinc-100'
            : positive
              ? 'text-emerald-600 dark:text-emerald-300'
              : 'text-red-600 dark:text-red-300'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DeltaStat({
  label,
  current,
  previous,
  isPercent = false,
  digits = 1,
}: {
  label: string;
  current: number;
  previous: number;
  isPercent?: boolean;
  digits?: number;
}) {
  const delta = current - previous;
  const isPositive = delta >= 0;

  const formattedCurrent = isPercent
    ? formatPercent(current, digits)
    : formatSigned(current, digits);

  const formattedDelta = isPercent
    ? `${isPositive ? '+' : ''}${delta.toFixed(digits)}pp`
    : formatSigned(delta, digits);

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-zinc-100">
        {formattedCurrent}
      </p>
      <p
        className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
          isPositive
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-red-600 dark:text-red-300'
        }`}
      >
        {isPositive ? <FaArrowUp /> : <FaArrowDown />}
        {formattedDelta}
      </p>
    </div>
  );
}

function DiagnosticCard({ item }: { item: DiagnosticRow }) {
  const signalStyles =
    item.signal === 'strong'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
      : item.signal === 'watch'
        ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
        : 'border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200';

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-black/50">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          {item.title}
        </h4>
        <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${signalStyles}`}>
          {item.signal.toUpperCase()}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <FaBalanceScale className="text-gray-400 dark:text-zinc-500" />
        <span className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
          {item.score}/100
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-gray-600 dark:text-zinc-300">
        {item.detail}
      </p>
    </div>
  );
}

function TradeSnapshotCard({
  title,
  trade,
  positive = false,
}: {
  title: string;
  trade: WeeklyReport['bestTrade'] | WeeklyReport['worstTrade'];
  positive?: boolean;
}) {
  const pnl = toNumber(trade?.pnl);

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
      <h3
        className={`text-sm font-semibold uppercase tracking-wide ${
          positive
            ? 'text-emerald-700 dark:text-emerald-300'
            : 'text-red-700 dark:text-red-300'
        }`}
      >
        {title}
      </h3>
      {!trade ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          No snapshot available.
        </p>
      ) : (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-black/50">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              {trade.symbol} • {trade.side}
            </p>
            <p
              className={`text-sm font-semibold ${
                pnl >= 0
                  ? 'text-emerald-600 dark:text-emerald-300'
                  : 'text-red-600 dark:text-red-300'
              }`}
            >
              {formatSigned(pnl)}
            </p>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-zinc-400">
            {trade.holdMinutes ? `Held ${trade.holdMinutes} min` : 'Hold time unavailable'}
            {' • '}
            Exit {formatDateTime(trade.closeTime)}
          </p>
        </div>
      )}
    </div>
  );
}

function InsightList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: { title: string; detail: string }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          {emptyText}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-black/50"
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-zinc-300">
                {item.detail}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
