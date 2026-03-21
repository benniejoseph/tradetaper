import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReplaySession } from '../entities/replay-session.entity';
import { BacktestChartLayout } from '../entities/backtest-chart-layout.entity';

export interface CreateSessionDto {
  userId: string;
  symbol: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  startingBalance?: number;
}

export interface UpdateSessionDto {
  trades?: Record<string, unknown>[];
  openPositions?: Record<string, unknown>[];
  pendingOrders?: Record<string, unknown>[];
  journalEntries?: Record<string, unknown>[];
  endingBalance?: number;
  totalPnl?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate?: number;
  status?: 'in_progress' | 'completed' | 'abandoned';
}

export interface ReplaySessionSourceSummary {
  source: string;
  trades: number;
  winRate: number;
  pnl: number;
}

export interface ReplaySessionTradeAnalytics {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  expectancy: number;
  averageWin: number;
  averageLoss: number;
  averagePnl: number;
  largestWin: number;
  largestLoss: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  averageHoldingMinutes: number;
  startingBalance: number;
  endingBalance: number;
  maxDrawdown: number;
  maxDrawdownPct: number;
  sourceBreakdown: ReplaySessionSourceSummary[];
}

export interface ReplaySessionReviewReport {
  sessionId: string;
  symbol: string;
  timeframe: string;
  status: string;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  inputs: {
    closedTrades: number;
    openPositions: number;
    pendingOrders: number;
    journalEntries: number;
  };
  tradeAnalytics: ReplaySessionTradeAnalytics;
  executionFindings: string[];
  behavioralInsights: string[];
  journalHighlights: string[];
  nextSessionChecklist: string[];
}

export type ReplaySessionReviewExportFormat = 'json' | 'pdf';

export interface ReplaySessionReviewExportPayload {
  filename: string;
  contentType: string;
  content: string | Buffer;
}

interface NormalizedClosedTrade {
  index: number;
  pnl: number;
  side: string;
  volume: number;
  entryPrice: number | null;
  exitPrice: number | null;
  entryTime: number | null;
  exitTime: number | null;
  source: string;
}

@Injectable()
export class ReplaySessionService {
  private readonly logger = new Logger(ReplaySessionService.name);

  constructor(
    @InjectRepository(ReplaySession)
    private readonly replaySessionRepo: Repository<ReplaySession>,
    @InjectRepository(BacktestChartLayout)
    private readonly backtestChartLayoutRepo: Repository<BacktestChartLayout>,
  ) {}

  /**
   * Create a new replay session
   */
  async createSession(data: CreateSessionDto): Promise<ReplaySession> {
    const session = this.replaySessionRepo.create({
      userId: data.userId,
      symbol: data.symbol,
      timeframe: data.timeframe,
      startDate: data.startDate,
      endDate: data.endDate,
      startingBalance: data.startingBalance || 100000,
      status: 'in_progress',
      trades: [],
      openPositions: [],
      pendingOrders: [],
      journalEntries: [],
      reviewReport: null,
    });

    await this.replaySessionRepo.save(session);
    this.logger.log(`Created replay session: ${session.id}`);
    return session;
  }

  /**
   * Update an existing replay session
   */
  async updateSession(
    sessionId: string,
    userId: string,
    data: UpdateSessionDto,
  ): Promise<ReplaySession> {
    const session = await this.replaySessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    // Update fields
    if (data.trades !== undefined) session.trades = data.trades;
    if (data.openPositions !== undefined)
      session.openPositions = data.openPositions;
    if (data.pendingOrders !== undefined)
      session.pendingOrders = data.pendingOrders;
    if (data.journalEntries !== undefined)
      session.journalEntries = data.journalEntries;
    if (
      data.trades !== undefined ||
      data.openPositions !== undefined ||
      data.pendingOrders !== undefined ||
      data.journalEntries !== undefined
    ) {
      session.reviewReport = null;
    }
    if (data.endingBalance !== undefined)
      session.endingBalance = data.endingBalance;
    if (data.totalPnl !== undefined) session.totalPnl = data.totalPnl;
    if (data.totalTrades !== undefined) session.totalTrades = data.totalTrades;
    if (data.winningTrades !== undefined)
      session.winningTrades = data.winningTrades;
    if (data.losingTrades !== undefined)
      session.losingTrades = data.losingTrades;
    if (data.winRate !== undefined) session.winRate = data.winRate;
    if (data.status !== undefined) session.status = data.status;

    if (session.status === 'completed') {
      const report = this.buildSessionReviewReport(session);
      session.reviewReport = report;
      this.applyReportSnapshot(session, report);
    }

    await this.replaySessionRepo.save(session);
    this.logger.log(`Updated replay session: ${sessionId}`);
    return session;
  }

  /**
   * Complete a replay session with final stats
   */
  async completeSession(
    sessionId: string,
    userId: string,
    finalStats: {
      endingBalance: number;
      trades: Record<string, unknown>[];
    },
  ): Promise<ReplaySession> {
    const session = await this.replaySessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    // Calculate final stats
    const totalTrades = finalStats.trades.length;
    const winningTrades = finalStats.trades.filter((trade) => {
      if (!trade || typeof trade !== 'object') return false;
      return this.toNumber((trade as Record<string, unknown>).pnl, 0) > 0;
    }).length;
    const losingTrades = finalStats.trades.filter((trade) => {
      if (!trade || typeof trade !== 'object') return false;
      return this.toNumber((trade as Record<string, unknown>).pnl, 0) < 0;
    }).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const totalPnl = finalStats.endingBalance - session.startingBalance;

    session.endingBalance = finalStats.endingBalance;
    session.trades = finalStats.trades;
    session.totalTrades = totalTrades;
    session.winningTrades = winningTrades;
    session.losingTrades = losingTrades;
    session.winRate = winRate;
    session.totalPnl = totalPnl;
    session.status = 'completed';
    const report = this.buildSessionReviewReport(session);
    session.reviewReport = report;
    this.applyReportSnapshot(session, report);

    await this.replaySessionRepo.save(session);
    this.logger.log(`Completed replay session: ${sessionId}`);
    return session;
  }

  /**
   * Get a single replay session
   */
  async getSession(sessionId: string, userId: string): Promise<ReplaySession> {
    const session = await this.replaySessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    return session;
  }

  /**
   * Get all replay sessions for a user
   */
  async getUserSessions(userId: string): Promise<ReplaySession[]> {
    return this.replaySessionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete a replay session
   */
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const result = await this.replaySessionRepo.delete({ id: sessionId, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }

    this.logger.log(`Deleted replay session: ${sessionId}`);
  }

  /**
   * Abandon a session (mark as abandoned without deleting)
   */
  async abandonSession(sessionId: string, userId: string): Promise<ReplaySession> {
    const session = await this.getSession(sessionId, userId);
    session.status = 'abandoned';
    await this.replaySessionRepo.save(session);
    return session;
  }

  async getSessionReviewReport(
    sessionId: string,
    userId: string,
    options?: { refresh?: boolean },
  ): Promise<ReplaySessionReviewReport> {
    const session = await this.getSession(sessionId, userId);
    if (!options?.refresh && session.reviewReport) {
      return session.reviewReport as unknown as ReplaySessionReviewReport;
    }

    return this.generateSessionReviewReport(sessionId, userId);
  }

  async generateSessionReviewReport(
    sessionId: string,
    userId: string,
  ): Promise<ReplaySessionReviewReport> {
    const session = await this.getSession(sessionId, userId);
    const report = this.buildSessionReviewReport(session);

    session.reviewReport = report;
    this.applyReportSnapshot(session, report);

    await this.replaySessionRepo.save(session);
    return report;
  }

  async exportSessionReviewReport(
    sessionId: string,
    userId: string,
    format: ReplaySessionReviewExportFormat,
    options?: { refresh?: boolean },
  ): Promise<ReplaySessionReviewExportPayload> {
    const report = await this.getSessionReviewReport(sessionId, userId, options);
    const datePart = new Date().toISOString().slice(0, 10);
    const baseFilename = `replay-session-review-${sessionId}-${datePart}`;

    if (format === 'pdf') {
      return {
        filename: `${baseFilename}.pdf`,
        contentType: 'application/pdf',
        content: this.renderSessionReviewReportPdf(report),
      };
    }

    return {
      filename: `${baseFilename}.json`,
      contentType: 'application/json',
      content: JSON.stringify(report, null, 2),
    };
  }

  async getChartLayout(
    sessionId: string,
    userId: string,
  ): Promise<Record<string, unknown> | null> {
    await this.getSession(sessionId, userId);

    const record = await this.backtestChartLayoutRepo.findOne({
      where: { sessionId, userId },
    });

    return record?.layout || null;
  }

  async saveChartLayout(
    sessionId: string,
    userId: string,
    layout: Record<string, unknown> | null,
  ): Promise<Record<string, unknown> | null> {
    await this.getSession(sessionId, userId);

    let record = await this.backtestChartLayoutRepo.findOne({
      where: { sessionId, userId },
    });

    if (!record) {
      record = this.backtestChartLayoutRepo.create({
        sessionId,
        userId,
      });
    }

    record.layout = layout;
    await this.backtestChartLayoutRepo.save(record);

    return record.layout || null;
  }

  private applyReportSnapshot(
    session: ReplaySession,
    report: ReplaySessionReviewReport,
  ): void {
    session.totalTrades = report.tradeAnalytics.totalTrades;
    session.winningTrades = report.tradeAnalytics.wins;
    session.losingTrades = report.tradeAnalytics.losses;
    session.winRate = report.tradeAnalytics.winRate;
    session.totalPnl = report.tradeAnalytics.netPnl;
    session.endingBalance = report.tradeAnalytics.endingBalance;
  }

  private renderSessionReviewReportPdf(
    report: ReplaySessionReviewReport,
  ): Buffer {
    const lines = this.buildSessionReviewPdfLines(report);
    return this.buildPlainTextPdf(lines);
  }

  private buildSessionReviewPdfLines(
    report: ReplaySessionReviewReport,
  ): string[] {
    const tradeAnalytics = report.tradeAnalytics;
    const dateRange = `${report.period.startDate} -> ${report.period.endDate}`;

    const lines: string[] = [
      'TradeTaper Session Review Report',
      '',
      `Session ID: ${report.sessionId}`,
      `Symbol / Timeframe: ${report.symbol} / ${report.timeframe}`,
      `Status: ${report.status}`,
      `Generated At: ${report.generatedAt}`,
      `Date Range: ${dateRange}`,
      '',
      'Trade Analytics',
      `  Total Trades: ${tradeAnalytics.totalTrades}`,
      `  Wins / Losses / Breakeven: ${tradeAnalytics.wins} / ${tradeAnalytics.losses} / ${tradeAnalytics.breakevens}`,
      `  Win Rate: ${tradeAnalytics.winRate}%`,
      `  Net P&L: ${tradeAnalytics.netPnl}`,
      `  Gross Profit / Loss: ${tradeAnalytics.grossProfit} / ${tradeAnalytics.grossLoss}`,
      `  Profit Factor: ${tradeAnalytics.profitFactor}`,
      `  Expectancy: ${tradeAnalytics.expectancy}`,
      `  Max Drawdown: ${tradeAnalytics.maxDrawdown} (${tradeAnalytics.maxDrawdownPct}%)`,
      `  Avg Win / Avg Loss: ${tradeAnalytics.averageWin} / ${tradeAnalytics.averageLoss}`,
      `  Max Streak (W/L): ${tradeAnalytics.maxConsecutiveWins} / ${tradeAnalytics.maxConsecutiveLosses}`,
      '',
      'Execution Findings',
      ...this.normalizeReportLineItems(report.executionFindings),
      '',
      'Behavioral Insights',
      ...this.normalizeReportLineItems(report.behavioralInsights),
      '',
      'Journal Highlights',
      ...this.normalizeReportLineItems(report.journalHighlights),
      '',
      'Next Session Checklist',
      ...this.normalizeReportLineItems(report.nextSessionChecklist),
    ];

    return lines;
  }

  private normalizeReportLineItems(items: string[]): string[] {
    if (!Array.isArray(items) || items.length === 0) {
      return ['- None'];
    }
    return items.map((item) => `- ${item}`);
  }

  private buildPlainTextPdf(lines: string[]): Buffer {
    const safeLines = lines
      .flatMap((line) => this.wrapPdfLine(line, 110))
      .slice(0, 54)
      .map((line) => this.escapePdfText(line));

    const textStream = [
      'BT',
      '/F1 10 Tf',
      '14 TL',
      '40 780 Td',
      ...safeLines.flatMap((line, index) =>
        index === 0 ? [`(${line}) Tj`] : ['T*', `(${line}) Tj`],
      ),
      'ET',
    ].join('\n');

    const objects: string[] = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
    objects[3] =
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[5] = `<< /Length ${Buffer.byteLength(textStream, 'utf8')} >>\nstream\n${textStream}\nendstream`;

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (let i = 1; i <= 5; i += 1) {
      offsets[i] = Buffer.byteLength(pdf, 'utf8');
      pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }

    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += 'xref\n0 6\n';
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i <= 5; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }

    pdf += 'trailer\n';
    pdf += '<< /Size 6 /Root 1 0 R >>\n';
    pdf += 'startxref\n';
    pdf += `${xrefOffset}\n`;
    pdf += '%%EOF';

    return Buffer.from(pdf, 'utf8');
  }

  private wrapPdfLine(line: string, maxChars: number): string[] {
    const input = (line || '').trim();
    if (!input) return [''];
    if (input.length <= maxChars) return [input];

    const chunks: string[] = [];
    let remaining = input;

    while (remaining.length > maxChars) {
      const slice = remaining.slice(0, maxChars);
      const splitAt = slice.lastIndexOf(' ');
      const index = splitAt > maxChars * 0.6 ? splitAt : maxChars;
      chunks.push(remaining.slice(0, index).trimEnd());
      remaining = remaining.slice(index).trimStart();
    }

    if (remaining.length > 0) {
      chunks.push(remaining);
    }

    return chunks;
  }

  private escapePdfText(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }

  private buildSessionReviewReport(
    session: ReplaySession,
  ): ReplaySessionReviewReport {
    const closedTrades = this.normalizeClosedTrades(session.trades || []);
    const openPositions = Array.isArray(session.openPositions)
      ? session.openPositions
      : [];
    const pendingOrders = Array.isArray(session.pendingOrders)
      ? session.pendingOrders
      : [];
    const journalEntries = Array.isArray(session.journalEntries)
      ? session.journalEntries
      : [];

    const wins = closedTrades.filter((trade) => trade.pnl > 0).length;
    const losses = closedTrades.filter((trade) => trade.pnl < 0).length;
    const breakevens = closedTrades.filter((trade) => trade.pnl === 0).length;

    const grossProfit = closedTrades.reduce(
      (sum, trade) => sum + (trade.pnl > 0 ? trade.pnl : 0),
      0,
    );
    const grossLoss = Math.abs(
      closedTrades.reduce((sum, trade) => sum + (trade.pnl < 0 ? trade.pnl : 0), 0),
    );
    const netPnl = grossProfit - grossLoss;
    const totalTrades = closedTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;
    const averageWin = wins > 0 ? grossProfit / wins : 0;
    const averageLoss = losses > 0 ? grossLoss / losses : 0;
    const averagePnl = totalTrades > 0 ? netPnl / totalTrades : 0;
    const profitFactor =
      grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999.99 : 0;
    const largestWin = closedTrades.reduce(
      (max, trade) => (trade.pnl > max ? trade.pnl : max),
      0,
    );
    const largestLoss = closedTrades.reduce(
      (min, trade) => (trade.pnl < min ? trade.pnl : min),
      0,
    );

    const holdingDurations = closedTrades
      .filter((trade) => trade.entryTime && trade.exitTime && trade.exitTime > trade.entryTime)
      .map((trade) => (trade.exitTime as number) - (trade.entryTime as number))
      .map((seconds) => seconds / 60);
    const averageHoldingMinutes =
      holdingDurations.length > 0
        ? holdingDurations.reduce((sum, minutes) => sum + minutes, 0) /
          holdingDurations.length
        : 0;

    const startingBalance = this.toNumber(session.startingBalance, 100000);
    const storedEndingBalance = this.toNumber(session.endingBalance, NaN);
    const endingBalance = Number.isFinite(storedEndingBalance)
      ? storedEndingBalance
      : startingBalance + netPnl;

    let runningEquity = startingBalance;
    let equityPeak = startingBalance;
    let maxDrawdown = 0;

    for (const trade of closedTrades) {
      runningEquity += trade.pnl;
      if (runningEquity > equityPeak) {
        equityPeak = runningEquity;
      }
      const drawdown = equityPeak - runningEquity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    const maxDrawdownPct = equityPeak > 0 ? (maxDrawdown / equityPeak) * 100 : 0;
    const { maxConsecutiveWins, maxConsecutiveLosses } =
      this.calculateConsecutiveResults(closedTrades);

    const sourceGroups = new Map<
      string,
      { trades: number; wins: number; pnl: number }
    >();
    for (const trade of closedTrades) {
      const source = trade.source || 'unknown';
      const current = sourceGroups.get(source) || { trades: 0, wins: 0, pnl: 0 };
      current.trades += 1;
      current.pnl += trade.pnl;
      if (trade.pnl > 0) current.wins += 1;
      sourceGroups.set(source, current);
    }

    const sourceBreakdown: ReplaySessionSourceSummary[] = [...sourceGroups.entries()]
      .map(([source, values]) => ({
        source,
        trades: values.trades,
        winRate: values.trades > 0 ? (values.wins / values.trades) * 100 : 0,
        pnl: values.pnl,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .map((entry) => ({
        ...entry,
        winRate: this.round(entry.winRate),
        pnl: this.round(entry.pnl),
      }));

    const executionFindings: string[] = [];
    if (totalTrades === 0) {
      executionFindings.push(
        'No closed trades yet. Complete at least 5 closed trades to unlock meaningful performance diagnostics.',
      );
    } else {
      if (profitFactor < 1) {
        executionFindings.push(
          'Gross losses are outweighing gross profits. Prioritize stop-loss discipline and lower-frequency high-conviction entries.',
        );
      } else if (profitFactor >= 1.5) {
        executionFindings.push(
          'Profit factor is healthy. Keep current entry quality while monitoring position sizing consistency.',
        );
      }

      if (maxConsecutiveLosses >= 3) {
        executionFindings.push(
          `Detected a ${maxConsecutiveLosses}-trade losing streak. Add a cooldown rule after 2 consecutive losses.`,
        );
      }

      if (averageHoldingMinutes > 0 && averageHoldingMinutes < 10) {
        executionFindings.push(
          'Average holding time is very short. Verify that exits are based on setup invalidation, not noise.',
        );
      }
    }

    if (openPositions.length > 0 || pendingOrders.length > 0) {
      executionFindings.push(
        `Session has ${openPositions.length} open position(s) and ${pendingOrders.length} pending order(s). Reconcile before locking the final review.`,
      );
    }

    const behavioralInsights: string[] = [];
    if (journalEntries.length === 0) {
      behavioralInsights.push(
        'No journal notes were captured. Add at least one note per setup to improve review quality.',
      );
    } else if (journalEntries.length < Math.max(2, Math.ceil(totalTrades / 2))) {
      behavioralInsights.push(
        'Journal density is light compared with trade count. Capture pre-trade intent and post-trade mistakes for each key setup.',
      );
    } else {
      behavioralInsights.push(
        'Journal coverage is strong relative to trade count. Continue linking notes to concrete execution decisions.',
      );
    }

    if (winRate < 40 && totalTrades >= 5) {
      behavioralInsights.push(
        'Win rate is below 40%. Re-validate setup filters before increasing replay speed or trade frequency.',
      );
    } else if (winRate >= 55 && totalTrades >= 5) {
      behavioralInsights.push(
        'Win rate is holding above 55%. Focus next on improving average winner size versus average loser size.',
      );
    }

    const journalHighlights = journalEntries
      .map((entry) => this.normalizeJournalEntry(entry))
      .filter((entry): entry is { note: string; candleIndex: number | null } => entry !== null)
      .slice(0, 5)
      .map((entry) =>
        entry.candleIndex
          ? `Candle #${entry.candleIndex}: ${entry.note}`
          : entry.note,
      );

    const nextSessionChecklist: string[] = [];
    nextSessionChecklist.push('Define max risk per trade before replay starts.');
    nextSessionChecklist.push('Tag each trade with setup reason before advancing to the next candle.');
    if (openPositions.length > 0) {
      nextSessionChecklist.push(
        `Close or carry forward ${openPositions.length} open position(s) before the next review cycle.`,
      );
    }
    if (pendingOrders.length > 0) {
      nextSessionChecklist.push(
        `Cancel or execute ${pendingOrders.length} pending order(s) before session closeout.`,
      );
    }
    if (journalEntries.length < 3) {
      nextSessionChecklist.push('Record at least 3 journal notes covering entry logic, risk, and post-trade reflection.');
    }

    if (nextSessionChecklist.length > 5) {
      nextSessionChecklist.splice(5);
    }

    return {
      sessionId: session.id,
      symbol: session.symbol,
      timeframe: session.timeframe,
      status: session.status,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: session.startDate.toISOString(),
        endDate: session.endDate.toISOString(),
      },
      inputs: {
        closedTrades: totalTrades,
        openPositions: openPositions.length,
        pendingOrders: pendingOrders.length,
        journalEntries: journalEntries.length,
      },
      tradeAnalytics: {
        totalTrades,
        wins,
        losses,
        breakevens,
        winRate: this.round(winRate),
        netPnl: this.round(netPnl),
        grossProfit: this.round(grossProfit),
        grossLoss: this.round(grossLoss),
        profitFactor: this.round(profitFactor),
        expectancy: this.round(expectancy),
        averageWin: this.round(averageWin),
        averageLoss: this.round(averageLoss),
        averagePnl: this.round(averagePnl),
        largestWin: this.round(largestWin),
        largestLoss: this.round(largestLoss),
        maxConsecutiveWins,
        maxConsecutiveLosses,
        averageHoldingMinutes: this.round(averageHoldingMinutes),
        startingBalance: this.round(startingBalance),
        endingBalance: this.round(endingBalance),
        maxDrawdown: this.round(maxDrawdown),
        maxDrawdownPct: this.round(maxDrawdownPct),
        sourceBreakdown,
      },
      executionFindings,
      behavioralInsights,
      journalHighlights,
      nextSessionChecklist,
    };
  }

  private normalizeClosedTrades(
    trades: Record<string, unknown>[],
  ): NormalizedClosedTrade[] {
    return trades
      .map((rawTrade, index) => {
        if (!rawTrade || typeof rawTrade !== 'object') return null;
        const trade = rawTrade as Record<string, unknown>;
        const rawSide =
          typeof trade.side === 'string'
            ? trade.side.toUpperCase()
            : typeof trade.type === 'string'
              ? trade.type.toUpperCase()
              : 'UNKNOWN';
        const side =
          rawSide === 'LONG' ? 'BUY' : rawSide === 'SHORT' ? 'SELL' : rawSide;

        const source =
          typeof trade.source === 'string' && trade.source.trim().length > 0
            ? trade.source.trim().toLowerCase()
            : 'unknown';

        return {
          index,
          pnl: this.toNumber(trade.pnl, 0),
          side,
          volume: this.toNumber(trade.lotSize, 0),
          entryPrice: this.toNullableNumber(trade.entry),
          exitPrice: this.toNullableNumber(trade.exitPrice),
          entryTime: this.toTimestampSeconds(trade.entryTime),
          exitTime: this.toTimestampSeconds(trade.exitTime),
          source,
        };
      })
      .filter((trade): trade is NormalizedClosedTrade => trade !== null)
      .sort((a, b) => {
        const aTime = a.exitTime || a.entryTime || 0;
        const bTime = b.exitTime || b.entryTime || 0;
        if (aTime === bTime) return a.index - b.index;
        return aTime - bTime;
      });
  }

  private calculateConsecutiveResults(trades: NormalizedClosedTrade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  } {
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if (trade.pnl > 0) {
        currentWins += 1;
        currentLosses = 0;
        if (currentWins > maxConsecutiveWins) maxConsecutiveWins = currentWins;
      } else if (trade.pnl < 0) {
        currentLosses += 1;
        currentWins = 0;
        if (currentLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentLosses;
        }
      } else {
        currentWins = 0;
        currentLosses = 0;
      }
    }

    return { maxConsecutiveWins, maxConsecutiveLosses };
  }

  private normalizeJournalEntry(
    input: Record<string, unknown>,
  ): { note: string; candleIndex: number | null } | null {
    if (!input || typeof input !== 'object') return null;
    const noteValue = input.note;
    if (typeof noteValue !== 'string') return null;
    const note = noteValue.trim();
    if (!note) return null;

    const candleIndex = this.toNullableNumber(input.candleIndex);
    return {
      note,
      candleIndex,
    };
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed;
  }

  private toNullableNumber(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    return parsed;
  }

  private toTimestampSeconds(value: unknown): number | null {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;

    // Support both milliseconds and seconds payload formats from the client.
    if (parsed > 1_000_000_000_000) {
      return Math.floor(parsed / 1000);
    }

    return Math.floor(parsed);
  }

  private round(value: number, precision = 2): number {
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }
}
