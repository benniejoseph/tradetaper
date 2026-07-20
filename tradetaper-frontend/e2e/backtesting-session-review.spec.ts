import { expect, test } from '@playwright/test';

const SESSION_ID = '11111111-1111-4111-8111-111111111111';

const buildCandles = () => {
  const candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }> = [];

  let cursor = 1704067200;
  let price = 2120;

  for (let i = 0; i < 140; i += 1) {
    const drift = ((i % 7) - 3) * 0.08;
    const open = Number(price.toFixed(2));
    const close = Number((price + drift).toFixed(2));
    const high = Number((Math.max(open, close) + 0.22).toFixed(2));
    const low = Number((Math.min(open, close) - 0.22).toFixed(2));

    candles.push({ time: cursor, open, high, low, close });
    price = close;
    cursor += 60;
  }

  return candles;
};

const createReviewReport = (generatedAt: string) => ({
  sessionId: SESSION_ID,
  symbol: 'XAUUSD',
  timeframe: '15m',
  status: 'in_progress',
  generatedAt,
  period: {
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-01-03T00:00:00.000Z',
  },
  inputs: {
    closedTrades: 2,
    openPositions: 0,
    pendingOrders: 0,
    journalEntries: 1,
  },
  tradeAnalytics: {
    totalTrades: 2,
    wins: 1,
    losses: 1,
    breakevens: 0,
    winRate: 50,
    netPnl: 109.75,
    grossProfit: 150.25,
    grossLoss: 40.5,
    profitFactor: 3.71,
    expectancy: 54.88,
    averageWin: 150.25,
    averageLoss: 40.5,
    averagePnl: 54.88,
    largestWin: 150.25,
    largestLoss: -40.5,
    maxConsecutiveWins: 1,
    maxConsecutiveLosses: 1,
    averageHoldingMinutes: 13.5,
    startingBalance: 100000,
    endingBalance: 100109.75,
    maxDrawdown: 40.5,
    maxDrawdownPct: 0.04,
    sourceBreakdown: [
      { source: 'market', trades: 1, winRate: 100, pnl: 150.25 },
      { source: 'pending', trades: 1, winRate: 0, pnl: -40.5 },
    ],
  },
  executionFindings: ['Gross losses are under control relative to profits.'],
  behavioralInsights: ['Journal coverage is strong relative to trade count.'],
  journalHighlights: ['Candle #42: Waited for displacement before entry.'],
  nextSessionChecklist: ['Define max risk per trade before replay starts.'],
});

test('replay save -> review tab -> regenerate flow', async ({ page }) => {
  const candles = buildCandles();
  const patchPayloads: unknown[] = [];
  let reviewCalls = 0;
  let refreshCalls = 0;

  const tvStubScript = `
    window.TradingView = {
      widget: function() {
        let readyCallback = null;
        const api = {
          remove: function() {},
          onChartReady: function(cb) {
            readyCallback = cb;
            setTimeout(function() {
              if (readyCallback) readyCallback();
            }, 0);
          },
          activeChart: function() {
            return {
              setSymbol: function() {},
              resetData: function() {},
            };
          },
          changeTheme: function() {},
          save: function(cb) { cb({ panes: [] }); },
          load: function() {},
        };
        return api;
      }
    };
  `;

  await page.route('**/charting_library/charting_library.js', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: tvStubScript,
    });
  });

  await page.route(
    '**/charting_library/charting_library.standalone.js',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: tvStubScript,
      });
    },
  );

  await page.route('**/api/v1/backtesting/candles/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(candles),
    });
  });

  await page.route('**/api/v1/csrf-token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ csrfToken: 'e2e-token' }),
    });
  });

  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-user',
        email: 'e2e@tradetaper.com',
        firstName: 'E2E',
        lastName: 'User',
        subscription: {
          plan: 'premium',
          planDetails: {
            limits: {
              backtesting: 'full',
              aiAnalysis: true,
              reports: true,
              psychology: true,
              discipline: true,
            },
          },
        },
      }),
    });
  });

  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(
    `**/api/v1/backtesting/sessions/${SESSION_ID}/chart-layout`,
    async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ layout: null }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ layout: null }),
      });
    },
  );

  await page.route(
    `**/api/v1/backtesting/sessions/${SESSION_ID}/review-report**`,
    async (route) => {
      reviewCalls += 1;
      const url = new URL(route.request().url());
      const refresh =
        url.searchParams.get('refresh') === 'true' ||
        url.searchParams.get('refresh') === '1' ||
        url.searchParams.get('refresh') === 'yes';

      if (refresh) {
        refreshCalls += 1;
      }

      const report = createReviewReport(
        refresh ? '2026-03-21T15:45:00.000Z' : '2026-03-21T15:15:00.000Z',
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(report),
      });
    },
  );

  await page.route(
    `**/api/v1/backtesting/sessions/${SESSION_ID}`,
    async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: SESSION_ID,
            symbol: 'XAUUSD',
            timeframe: '15m',
            trades: [],
            openPositions: [],
            pendingOrders: [],
            journalEntries: [],
            endingBalance: 100000,
            reviewReport: null,
          }),
        });
        return;
      }

      if (method === 'PATCH') {
        patchPayloads.push(route.request().postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: SESSION_ID, updated: true }),
        });
        return;
      }

      await route.continue();
    },
  );

  await page.goto(
    `/backtesting/session/${SESSION_ID}?symbol=XAUUSD&timeframe=15m&startDate=2024-01-01&endDate=2024-01-03&balance=100000`,
  );

  await expect(
    page.getByText('XAUUSD 15M Replay Session', { exact: false }),
  ).toBeVisible();

  const saveButton = page.getByRole('button', { name: 'Save' }).first();
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  const okButton = page.getByRole('button', { name: 'OK' });
  await expect(okButton).toBeVisible();
  await okButton.click();

  await expect
    .poll(() => patchPayloads.length, { message: 'session patch call count' })
    .toBeGreaterThan(0);

  const latestPatch = patchPayloads[patchPayloads.length - 1] as {
    status?: string;
    trades?: unknown[];
    openPositions?: unknown[];
    pendingOrders?: unknown[];
    journalEntries?: unknown[];
  };

  expect(latestPatch.status).toBe('in_progress');
  expect(Array.isArray(latestPatch.trades)).toBe(true);
  expect(Array.isArray(latestPatch.openPositions)).toBe(true);
  expect(Array.isArray(latestPatch.pendingOrders)).toBe(true);
  expect(Array.isArray(latestPatch.journalEntries)).toBe(true);

  await page.getByRole('button', { name: 'Review' }).click();
  await expect(page.getByText('Session Review Report')).toBeVisible();
  await expect(page.getByText('+$109.75')).toBeVisible();

  await expect
    .poll(() => reviewCalls, { message: 'review report fetch count' })
    .toBeGreaterThan(0);

  const refreshBefore = refreshCalls;
  await page.getByRole('button', { name: 'Regenerate' }).click();

  await expect
    .poll(() => refreshCalls, { message: 'refresh review report fetch count' })
    .toBeGreaterThan(refreshBefore);
});
