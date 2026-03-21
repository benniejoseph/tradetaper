import { ExecutionContext, INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ConfigService } from '@nestjs/config';
import { BacktestingController } from '../src/backtesting/backtesting.controller';
import { BacktestingService } from '../src/backtesting/backtesting.service';
import { TagService } from '../src/backtesting/services/tag.service';
import { BacktestInsightsService } from '../src/backtesting/services/backtest-insights.service';
import { CandleManagementService } from '../src/backtesting/services/candle-management.service';
import {
  ReplaySessionService,
  CreateSessionDto,
  UpdateSessionDto,
  ReplaySessionReviewReport,
  ReplaySessionReviewExportFormat,
} from '../src/backtesting/services/replay-session.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { FeatureAccessGuard } from '../src/subscriptions/guards/feature-access.guard';

type ReplaySessionRecord = {
  id: string;
  userId: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  startingBalance: number;
  endingBalance: number | null;
  trades: Record<string, unknown>[];
  openPositions: Record<string, unknown>[];
  pendingOrders: Record<string, unknown>[];
  journalEntries: Record<string, unknown>[];
  reviewReport: ReplaySessionReviewReport | null;
  totalPnl: number | null;
  totalTrades: number | null;
  winningTrades: number | null;
  losingTrades: number | null;
  winRate: number | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
};

const buildSessionId = (counter: number): string =>
  `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;

class ReplaySessionServiceStub {
  private readonly sessions = new Map<string, ReplaySessionRecord>();
  private readonly layouts = new Map<string, Record<string, unknown> | null>();
  private counter = 1;

  async createSession(data: CreateSessionDto): Promise<ReplaySessionRecord> {
    const id = buildSessionId(this.counter++);
    const now = new Date().toISOString();

    const record: ReplaySessionRecord = {
      id,
      userId: data.userId,
      symbol: data.symbol,
      timeframe: data.timeframe,
      startDate: data.startDate.toISOString(),
      endDate: data.endDate.toISOString(),
      startingBalance: data.startingBalance || 100000,
      endingBalance: null,
      trades: [],
      openPositions: [],
      pendingOrders: [],
      journalEntries: [],
      reviewReport: null,
      totalPnl: null,
      totalTrades: null,
      winningTrades: null,
      losingTrades: null,
      winRate: null,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(id, record);
    return record;
  }

  async getUserSessions(userId: string): Promise<ReplaySessionRecord[]> {
    return [...this.sessions.values()].filter((session) => session.userId === userId);
  }

  async getSession(sessionId: string, userId: string): Promise<ReplaySessionRecord> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new NotFoundException(`Replay session ${sessionId} not found`);
    }
    return session;
  }

  async updateSession(
    sessionId: string,
    userId: string,
    data: UpdateSessionDto,
  ): Promise<ReplaySessionRecord> {
    const session = await this.getSession(sessionId, userId);

    const updated: ReplaySessionRecord = {
      ...session,
      ...data,
      reviewReport:
        data.trades !== undefined ||
        data.openPositions !== undefined ||
        data.pendingOrders !== undefined ||
        data.journalEntries !== undefined
          ? null
          : session.reviewReport,
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  async completeSession(
    sessionId: string,
    userId: string,
    finalStats: { endingBalance: number; trades: Record<string, unknown>[] },
  ): Promise<ReplaySessionRecord> {
    const session = await this.getSession(sessionId, userId);
    const winningTrades = finalStats.trades.filter((trade) => Number(trade.pnl) > 0).length;
    const losingTrades = finalStats.trades.filter((trade) => Number(trade.pnl) < 0).length;

    const updated: ReplaySessionRecord = {
      ...session,
      endingBalance: finalStats.endingBalance,
      trades: finalStats.trades,
      totalTrades: finalStats.trades.length,
      winningTrades,
      losingTrades,
      winRate: finalStats.trades.length > 0
        ? Number(((winningTrades / finalStats.trades.length) * 100).toFixed(2))
        : 0,
      totalPnl: Number((finalStats.endingBalance - session.startingBalance).toFixed(2)),
      status: 'completed',
      reviewReport: null,
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getSession(sessionId, userId);
    this.sessions.delete(session.id);
  }

  async abandonSession(sessionId: string, userId: string): Promise<ReplaySessionRecord> {
    return this.updateSession(sessionId, userId, { status: 'abandoned' });
  }

  async getSessionReviewReport(
    sessionId: string,
    userId: string,
    options?: { refresh?: boolean },
  ): Promise<ReplaySessionReviewReport> {
    const session = await this.getSession(sessionId, userId);
    if (!options?.refresh && session.reviewReport) {
      return session.reviewReport;
    }
    return this.generateSessionReviewReport(sessionId, userId);
  }

  async generateSessionReviewReport(
    sessionId: string,
    userId: string,
  ): Promise<ReplaySessionReviewReport> {
    const session = await this.getSession(sessionId, userId);
    const trades = session.trades || [];
    const wins = trades.filter((trade) => Number(trade.pnl) > 0).length;
    const losses = trades.filter((trade) => Number(trade.pnl) < 0).length;
    const breakevens = trades.filter((trade) => Number(trade.pnl) === 0).length;
    const netPnl = trades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const grossProfit = trades
      .filter((trade) => Number(trade.pnl) > 0)
      .reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
    const grossLoss = Math.abs(
      trades
        .filter((trade) => Number(trade.pnl) < 0)
        .reduce((sum, trade) => sum + Number(trade.pnl || 0), 0),
    );
    const endingBalance =
      session.endingBalance ?? Number((session.startingBalance + netPnl).toFixed(2));

    const report: ReplaySessionReviewReport = {
      sessionId: session.id,
      symbol: session.symbol,
      timeframe: session.timeframe,
      status: session.status,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: session.startDate,
        endDate: session.endDate,
      },
      inputs: {
        closedTrades: trades.length,
        openPositions: session.openPositions.length,
        pendingOrders: session.pendingOrders.length,
        journalEntries: session.journalEntries.length,
      },
      tradeAnalytics: {
        totalTrades: trades.length,
        wins,
        losses,
        breakevens,
        winRate: trades.length > 0 ? Number(((wins / trades.length) * 100).toFixed(2)) : 0,
        netPnl: Number(netPnl.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: Number(grossLoss.toFixed(2)),
        profitFactor:
          grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 999.99 : 0,
        expectancy: trades.length > 0 ? Number((netPnl / trades.length).toFixed(2)) : 0,
        averageWin: wins > 0 ? Number((grossProfit / wins).toFixed(2)) : 0,
        averageLoss: losses > 0 ? Number((grossLoss / losses).toFixed(2)) : 0,
        averagePnl: trades.length > 0 ? Number((netPnl / trades.length).toFixed(2)) : 0,
        largestWin: trades.length > 0 ? Number(Math.max(...trades.map((trade) => Number(trade.pnl || 0))).toFixed(2)) : 0,
        largestLoss: trades.length > 0 ? Number(Math.min(...trades.map((trade) => Number(trade.pnl || 0))).toFixed(2)) : 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        averageHoldingMinutes: 0,
        startingBalance: Number(session.startingBalance.toFixed(2)),
        endingBalance: Number(endingBalance.toFixed(2)),
        maxDrawdown: 0,
        maxDrawdownPct: 0,
        sourceBreakdown: [],
      },
      executionFindings: [],
      behavioralInsights: [],
      journalHighlights: [],
      nextSessionChecklist: [],
    };

    const updated: ReplaySessionRecord = {
      ...session,
      reviewReport: report,
      endingBalance,
      totalTrades: report.tradeAnalytics.totalTrades,
      winningTrades: report.tradeAnalytics.wins,
      losingTrades: report.tradeAnalytics.losses,
      winRate: report.tradeAnalytics.winRate,
      totalPnl: report.tradeAnalytics.netPnl,
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updated);
    return report;
  }

  async exportSessionReviewReport(
    sessionId: string,
    userId: string,
    format: ReplaySessionReviewExportFormat,
    options?: { refresh?: boolean },
  ): Promise<{ filename: string; contentType: string; content: string | Buffer }> {
    const report = await this.getSessionReviewReport(sessionId, userId, options);
    const datePart = new Date().toISOString().slice(0, 10);
    const base = `replay-session-review-${sessionId}-${datePart}`;

    if (format === 'pdf') {
      return {
        filename: `${base}.pdf`,
        contentType: 'application/pdf',
        content: Buffer.from('%PDF-1.4\n% mock', 'utf8'),
      };
    }

    return {
      filename: `${base}.json`,
      contentType: 'application/json',
      content: JSON.stringify(report, null, 2),
    };
  }

  async getChartLayout(sessionId: string, userId: string): Promise<Record<string, unknown> | null> {
    await this.getSession(sessionId, userId);
    return this.layouts.get(sessionId) || null;
  }

  async saveChartLayout(
    sessionId: string,
    userId: string,
    layout: Record<string, unknown> | null,
  ): Promise<Record<string, unknown> | null> {
    await this.getSession(sessionId, userId);
    this.layouts.set(sessionId, layout || null);
    return layout || null;
  }
}

describe('Backtesting Session Terminal (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [BacktestingController],
      providers: [
        { provide: BacktestingService, useValue: {} },
        { provide: TagService, useValue: {} },
        { provide: BacktestInsightsService, useValue: {} },
        { provide: CandleManagementService, useValue: {} },
        { provide: ReplaySessionService, useClass: ReplaySessionServiceStub },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    });

    moduleBuilder.overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest<{ user?: { id: string } }>();
        request.user = { id: 'user-terminal-e2e' };
        return true;
      },
    });

    moduleBuilder.overrideGuard(FeatureAccessGuard).useValue({
      canActivate: () => true,
    });

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates a replay session with terminal state defaults', async () => {
    const response = await request(app.getHttpServer())
      .post('/backtesting/sessions')
      .send({
        symbol: 'XAUUSD',
        timeframe: '15m',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T00:00:00.000Z',
        startingBalance: 100000,
      })
      .expect(201);

    expect(response.body).toEqual(
      expect.objectContaining({
        symbol: 'XAUUSD',
        timeframe: '15m',
        trades: [],
        openPositions: [],
        pendingOrders: [],
        journalEntries: [],
        status: 'in_progress',
      }),
    );
  });

  it('persists pending orders and journal entries for tab hydration', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/backtesting/sessions')
      .send({
        symbol: 'EURUSD',
        timeframe: '5m',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-15T00:00:00.000Z',
      })
      .expect(201);

    const sessionId = createResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/backtesting/sessions/${sessionId}`)
      .send({
        pendingOrders: [
          {
            id: 'ord-1',
            side: 'BUY',
            symbol: 'EURUSD',
            volume: 0.3,
            entryPrice: 1.084,
            stopLoss: 1.082,
            takeProfit: 1.089,
            createdAt: 1704067200,
          },
        ],
        journalEntries: [
          {
            id: 'jnl-1',
            note: 'London open pullback + displacement confirmation.',
            candleIndex: 42,
            candleTime: 1704069700,
            createdAt: 1704069705000,
          },
        ],
      })
      .expect(200);

    const getResponse = await request(app.getHttpServer())
      .get(`/backtesting/sessions/${sessionId}`)
      .expect(200);

    expect(getResponse.body.pendingOrders).toHaveLength(1);
    expect(getResponse.body.journalEntries).toHaveLength(1);
    expect(getResponse.body.pendingOrders[0]).toEqual(
      expect.objectContaining({ side: 'BUY', symbol: 'EURUSD' }),
    );
    expect(getResponse.body.journalEntries[0]).toEqual(
      expect.objectContaining({ note: expect.stringContaining('London open') }),
    );
  });

  it('persists open positions, closed trades, and replay totals from ticket flows', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/backtesting/sessions')
      .send({
        symbol: 'GBPUSD',
        timeframe: '1m',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-08T00:00:00.000Z',
      })
      .expect(201);

    const sessionId = createResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/backtesting/sessions/${sessionId}`)
      .send({
        openPositions: [
          {
            id: 'pos-1',
            side: 'SELL',
            symbol: 'GBPUSD',
            volume: 0.5,
            entryPrice: 1.275,
            stopLoss: 1.278,
            takeProfit: 1.269,
            openedAt: 1704069200,
            source: 'market',
          },
        ],
        trades: [
          {
            id: 'closed-1',
            side: 'BUY',
            pnl: 82.5,
            entry: 1.272,
            exitPrice: 1.279,
            lotSize: 0.5,
            exitTime: 1704069600,
          },
        ],
        endingBalance: 100082.5,
        totalPnl: 82.5,
        totalTrades: 1,
        winningTrades: 1,
        losingTrades: 0,
        winRate: 100,
      })
      .expect(200);

    const hydrated = await request(app.getHttpServer())
      .get(`/backtesting/sessions/${sessionId}`)
      .expect(200);

    expect(hydrated.body.openPositions).toHaveLength(1);
    expect(hydrated.body.trades).toHaveLength(1);
    expect(Number(hydrated.body.endingBalance)).toBeCloseTo(100082.5, 2);
    expect(Number(hydrated.body.totalPnl)).toBeCloseTo(82.5, 2);
    expect(hydrated.body.totalTrades).toBe(1);
    expect(hydrated.body.winningTrades).toBe(1);
    expect(hydrated.body.winRate).toBe(100);
  });

  it('generates and persists session review report analytics', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/backtesting/sessions')
      .send({
        symbol: 'XAUUSD',
        timeframe: '15m',
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-02-10T00:00:00.000Z',
        startingBalance: 100000,
      })
      .expect(201);

    const sessionId = createResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/backtesting/sessions/${sessionId}`)
      .send({
        trades: [
          {
            id: 'closed-win',
            side: 'BUY',
            source: 'market',
            pnl: 120.5,
            entry: 2120.1,
            exitPrice: 2123.2,
            lotSize: 0.25,
            entryTime: 1706745600,
            exitTime: 1706746200,
          },
          {
            id: 'closed-loss',
            side: 'SELL',
            source: 'pending',
            pnl: -48.25,
            entry: 2123.5,
            exitPrice: 2124.1,
            lotSize: 0.2,
            entryTime: 1706746400,
            exitTime: 1706747000,
          },
        ],
        journalEntries: [
          {
            id: 'jnl-review',
            note: 'Accepted lower quality setup before NY open.',
            candleIndex: 88,
            createdAt: 1706747010000,
          },
        ],
      })
      .expect(200);

    const reportResponse = await request(app.getHttpServer())
      .post(`/backtesting/sessions/${sessionId}/review-report`)
      .expect(201);

    expect(reportResponse.body).toEqual(
      expect.objectContaining({
        sessionId,
        symbol: 'XAUUSD',
        tradeAnalytics: expect.objectContaining({
          totalTrades: 2,
          wins: 1,
          losses: 1,
          netPnl: 72.25,
          winRate: 50,
        }),
      }),
    );

    const cachedResponse = await request(app.getHttpServer())
      .get(`/backtesting/sessions/${sessionId}/review-report`)
      .expect(200);

    expect(cachedResponse.body.tradeAnalytics.totalTrades).toBe(2);
    expect(cachedResponse.body.tradeAnalytics.netPnl).toBeCloseTo(72.25, 2);
  });

  it('exports session review report as json and pdf', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/backtesting/sessions')
      .send({
        symbol: 'EURUSD',
        timeframe: '5m',
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-02-03T00:00:00.000Z',
      })
      .expect(201);

    const sessionId = createResponse.body.id;

    await request(app.getHttpServer())
      .patch(`/backtesting/sessions/${sessionId}`)
      .send({
        trades: [
          { id: 'exp-1', side: 'BUY', pnl: 35.5, entry: 1.08, exitPrice: 1.0812 },
          { id: 'exp-2', side: 'SELL', pnl: -12.25, entry: 1.081, exitPrice: 1.0817 },
        ],
        status: 'completed',
      })
      .expect(200);

    const jsonExport = await request(app.getHttpServer())
      .get(`/backtesting/sessions/${sessionId}/review-report/export?format=json`)
      .expect(200);

    expect(jsonExport.headers['content-type']).toContain('application/json');
    expect(jsonExport.headers['content-disposition']).toContain(
      `replay-session-review-${sessionId}`,
    );
    expect(jsonExport.text).toContain(sessionId);

    const pdfExport = await request(app.getHttpServer())
      .get(`/backtesting/sessions/${sessionId}/review-report/export?format=pdf`)
      .expect(200);

    expect(pdfExport.headers['content-type']).toContain('application/pdf');
    expect(pdfExport.headers['content-disposition']).toContain('.pdf');
    expect(Buffer.isBuffer(pdfExport.body)).toBe(true);
    expect(pdfExport.body.toString('utf8')).toContain('%PDF-1.4');
  });
});
