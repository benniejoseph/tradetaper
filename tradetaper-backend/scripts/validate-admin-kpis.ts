import 'dotenv/config';
import { DataSource } from 'typeorm';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import path from 'path';
import { promisify } from 'util';
import { execFile } from 'child_process';
import { readFile } from 'fs/promises';
import { AdminService } from '../src/admin/admin.service';
import { User } from '../src/users/entities/user.entity';
import { Account } from '../src/users/entities/account.entity';
import { Trade } from '../src/trades/entities/trade.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../src/subscriptions/entities/subscription.entity';
import { TradeStatus } from '../src/types/enums';

type MetricCheck = {
  name: string;
  actual: number;
  expected: number;
  tolerance?: number;
};

type DbConnectionAttempt = {
  host: string;
  port: number;
  username: string;
  source: string;
};

const DEFAULT_SUPABASE_POOLER_REGIONS = [
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
];

const NON_ACTIVE_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.INCOMPLETE,
  SubscriptionStatus.INCOMPLETE_EXPIRED,
];

const REVENUE_SUBSCRIPTION_STATUSES = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.UNPAID,
];

const execFileAsync = promisify(execFile);

type LinkedPoolerCandidate = {
  host: string;
  port: number;
  username: string;
};

function quote(values: string[]): string {
  return values.map((value) => `'${value}'`).join(', ');
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function round(value: number, decimals: number = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function percentGrowth(current: number, previous: number): number {
  if (previous <= 0) {
    return current > 0 ? 100 : 0;
  }
  return round(((current - previous) / previous) * 100, 2);
}

function getRangeStart(days: number): Date {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function getPreviousRangeStart(days: number): Date {
  const start = getRangeStart(days);
  const previousStart = new Date(start);
  previousStart.setUTCDate(previousStart.getUTCDate() - days);
  return previousStart;
}

function isWithinTolerance(
  actual: number,
  expected: number,
  tolerance: number,
): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function normalizePlanKey(value?: string | null): string {
  const plan = (value || '').trim().toLowerCase();
  if (!plan) return 'free';
  if (plan === 'pro') return 'essential';
  if (plan === 'starter' || plan === 'basic') return 'free';
  return plan;
}

function parseCsvEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function deriveSupabaseProjectRef(host: string): string | null {
  const normalized = host.trim().toLowerCase();
  const match = normalized.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  return match?.[1] || null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizePoolerPrefix(prefix: string): string {
  const trimmed = prefix.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.endsWith('-') ? trimmed.slice(0, -1) : trimmed;
}

async function getSupabaseRegionHint(projectRef: string | null): Promise<string | null> {
  if (!projectRef) {
    return null;
  }

  try {
    const { stdout } = await execFileAsync('supabase', [
      'projects',
      'list',
      '--output',
      'json',
    ]);
    const parsed = JSON.parse(stdout) as Array<Record<string, unknown>>;
    const project = parsed.find((entry) => {
      const candidateRefs = [
        entry.ref,
        entry.project_ref,
        entry.reference,
        entry.id,
      ]
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim().toLowerCase());
      return candidateRefs.includes(projectRef);
    });
    return typeof project?.region === 'string' ? project.region.trim() : null;
  } catch {
    return null;
  }
}

async function getLinkedSupabasePoolerCandidate(): Promise<LinkedPoolerCandidate | null> {
  const linkedPoolerPath = path.resolve(__dirname, '../supabase/.temp/pooler-url');
  try {
    const poolerUrlRaw = (await readFile(linkedPoolerPath, 'utf8')).trim();
    if (!poolerUrlRaw) {
      return null;
    }

    const parsed = new URL(poolerUrlRaw);
    const host = parsed.hostname?.trim();
    const username = decodeURIComponent(parsed.username || '').trim();
    const port = Number(parsed.port || '5432');
    if (!host || !username || !Number.isFinite(port) || port <= 0) {
      return null;
    }
    return {
      host,
      port: Math.floor(port),
      username,
    };
  } catch {
    return null;
  }
}

async function resolveIpv4Addresses(host: string): Promise<string[]> {
  if (isIP(host)) {
    return host.includes(':') ? [] : [host];
  }
  try {
    const result = await lookup(host, { all: true, family: 4 });
    return unique(result.map((entry) => entry.address));
  } catch {
    return [];
  }
}

function buildHostCandidates(
  primaryHost: string,
  projectRef: string | null,
  cliRegionHint: string | null,
): string[] {
  const explicitPoolerHost = process.env.DB_POOLER_HOST?.trim();
  const configuredHosts = parseCsvEnv(process.env.DB_HOST_CANDIDATES);
  const candidates = [
    ...(explicitPoolerHost ? [explicitPoolerHost] : []),
    primaryHost,
    ...configuredHosts,
  ];

  const poolerRegions = parseCsvEnv(process.env.SUPABASE_POOLER_REGIONS);
  const defaultPoolerRegion = process.env.SUPABASE_POOLER_REGION?.trim();
  const effectiveRegions = unique([
    ...(cliRegionHint ? [cliRegionHint] : []),
    ...poolerRegions,
    ...(defaultPoolerRegion ? [defaultPoolerRegion] : []),
    ...DEFAULT_SUPABASE_POOLER_REGIONS,
  ]);
  const configuredPrefixes = parseCsvEnv(process.env.SUPABASE_POOLER_HOST_PREFIXES);
  const effectivePrefixes = unique(
    [process.env.SUPABASE_POOLER_HOST_PREFIX, ...configuredPrefixes, 'aws-0', 'aws-1']
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map(normalizePoolerPrefix)
      .filter(Boolean),
  );

  if (projectRef) {
    for (const region of effectiveRegions) {
      for (const prefix of effectivePrefixes) {
        candidates.push(`${prefix}-${region}.pooler.supabase.com`);
      }
    }
  }

  return unique(candidates.filter(Boolean));
}

function buildPortCandidates(defaultPort: number): number[] {
  const configuredPorts = parseCsvEnv(process.env.DB_PORT_CANDIDATES)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.floor(value));

  const poolerPort = Number(process.env.DB_POOLER_PORT || '6543');
  const candidates = [defaultPort, ...configuredPorts];
  if (Number.isFinite(poolerPort) && poolerPort > 0) {
    candidates.push(Math.floor(poolerPort));
  }

  return unique(candidates);
}

function buildUsernameCandidates(primaryUsername: string, projectRef: string | null): string[] {
  const configuredUsernames = parseCsvEnv(process.env.DB_USER_CANDIDATES);
  const usernames = [primaryUsername, ...configuredUsernames];
  if (projectRef) {
    usernames.push(`postgres.${projectRef}`);
  }
  return unique(usernames.filter(Boolean));
}

function isPoolerHost(host: string): boolean {
  return host.includes('pooler.supabase.com');
}

function formatConnectionError(error: unknown): string {
  const errnoError = error as NodeJS.ErrnoException | undefined;
  const code = errnoError?.code || 'UNKNOWN';
  const message = error instanceof Error ? error.message : String(error);
  return `${code}: ${message}`;
}

async function buildConnectionAttempts(
  hosts: string[],
  ports: number[],
  usernames: string[],
): Promise<DbConnectionAttempt[]> {
  const attempts: DbConnectionAttempt[] = [];

  for (const host of hosts) {
    const hostIpv4s = await resolveIpv4Addresses(host);
    for (const port of ports) {
      for (const username of usernames) {
        if (isPoolerHost(host) || username.startsWith('postgres.')) {
          attempts.push({
            host,
            port,
            username,
            source: 'pooler/explicit-username',
          });
          for (const ipv4 of hostIpv4s) {
            attempts.push({
              host: ipv4,
              port,
              username,
              source: `ipv4-from-${host}`,
            });
          }
          continue;
        }

        attempts.push({ host, port, username, source: 'primary-hostname' });
        for (const ipv4 of hostIpv4s) {
          attempts.push({
            host: ipv4,
            port,
            username,
            source: `ipv4-from-${host}`,
          });
        }
      }
    }
  }

  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = `${attempt.host}|${attempt.port}|${attempt.username}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function createAuditDataSource(): Promise<DataSource> {
  const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;
  const parsedUrl =
    databaseUrl && databaseUrl.startsWith('postgres')
      ? new URL(databaseUrl)
      : null;

  const host = process.env.DB_HOST || parsedUrl?.hostname;
  const port = Number(process.env.DB_PORT || parsedUrl?.port || '5432');
  const username =
    process.env.DB_USER ||
    process.env.DB_USERNAME ||
    (parsedUrl ? decodeURIComponent(parsedUrl.username) : undefined);
  const password =
    process.env.DB_PASSWORD ||
    (parsedUrl ? decodeURIComponent(parsedUrl.password) : undefined);
  const database =
    process.env.DB_DATABASE ||
    process.env.DB_NAME ||
    (parsedUrl ? parsedUrl.pathname.replace(/^\//, '') : undefined);
  const isSsl = (process.env.DB_SSL || '').trim().toLowerCase() === 'true';

  if (!host || !username || !password || !database) {
    throw new Error(
      'Missing DB connection env vars. Required: DB_HOST, DB_USER/DB_USERNAME, DB_PASSWORD, DB_DATABASE/DB_NAME',
    );
  }

  const projectRef = deriveSupabaseProjectRef(host);
  const linkedPooler = await getLinkedSupabasePoolerCandidate();
  if (linkedPooler) {
    if (!process.env.DB_POOLER_HOST) {
      process.env.DB_POOLER_HOST = linkedPooler.host;
    }
    if (!process.env.DB_POOLER_PORT) {
      process.env.DB_POOLER_PORT = String(linkedPooler.port);
    }
    const userCandidates = new Set([
      ...parseCsvEnv(process.env.DB_USER_CANDIDATES),
      linkedPooler.username,
    ]);
    process.env.DB_USER_CANDIDATES = [...userCandidates].join(',');
    console.log(
      `[validate-admin-kpis] Loaded linked Supabase pooler candidate host=${linkedPooler.host} port=${linkedPooler.port} user=${linkedPooler.username}`,
    );
  }
  const cliRegionHint = await getSupabaseRegionHint(projectRef);
  const hostCandidates = buildHostCandidates(host, projectRef, cliRegionHint);
  const portCandidates = buildPortCandidates(port);
  const usernameCandidates = buildUsernameCandidates(username, projectRef);
  const attempts = await buildConnectionAttempts(
    hostCandidates,
    portCandidates,
    usernameCandidates,
  );

  const failedAttempts: string[] = [];
  for (const attempt of attempts) {
    const dataSource = new DataSource({
      type: 'postgres',
      host: attempt.host,
      port: attempt.port,
      username: attempt.username,
      password,
      database,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
      synchronize: false,
      logging: false,
      extra: {
        connectionTimeoutMillis: 8000,
      },
    });

    try {
      await dataSource.initialize();
      console.log(
        `[validate-admin-kpis] Connected via host=${attempt.host} port=${attempt.port} user=${attempt.username} (${attempt.source})`,
      );
      return dataSource;
    } catch (error) {
      failedAttempts.push(
        `host=${attempt.host} port=${attempt.port} user=${attempt.username} (${attempt.source}) -> ${formatConnectionError(error)}`,
      );
      if (dataSource.isInitialized) {
        await dataSource.destroy().catch(() => undefined);
      }
    }
  }

  throw new Error(
    `Unable to connect to DB after ${attempts.length} attempts.\n${failedAttempts.join('\n')}`,
  );
}

async function fetchSingleValue(
  dataSource: DataSource,
  sql: string,
  params: unknown[] = [],
): Promise<number> {
  const rows = await dataSource.query(sql, params);
  return toNumber(rows?.[0]?.value);
}

async function main() {
  const planExpression =
    "COALESCE(NULLIF(LOWER(sub.plan::text), ''), LOWER(sub.tier::text), 'free')";
  const nonActiveStatusesSql = quote(NON_ACTIVE_SUBSCRIPTION_STATUSES);
  const revenueStatusesSql = quote(REVENUE_SUBSCRIPTION_STATUSES);
  const periodDays = 30;
  const currentStart = getRangeStart(periodDays);
  const previousStart = getPreviousRangeStart(periodDays);

  let dataSource: DataSource | null = null;
  try {
    dataSource = await createAuditDataSource();
    const adminService = new AdminService(
      dataSource.getRepository(User),
      dataSource.getRepository(Account),
      dataSource.getRepository(Trade),
      dataSource.getRepository(Subscription),
      dataSource,
    );

    const [dashboardStats, subscriptionAnalytics, tradesView, accountsView] =
      await Promise.all([
        adminService.getDashboardStats(),
        adminService.getSubscriptionAnalytics('30d'),
        adminService.getTrades(1, 50),
        adminService.getAccounts(1, 50),
      ]);

    const [
      totalUsersExpected,
      totalTradesExpected,
      totalSubscriptionsExpected,
      activeUsersExpected,
      totalRevenueExpected,
      currentRevenueExpected,
      previousRevenueExpected,
      currentUsersExpected,
      previousUsersExpected,
      currentTradesExpected,
      previousTradesExpected,
      currentActiveUsersExpected,
      previousActiveUsersExpected,
      tradesSummaryRaw,
      accountsSummaryExpected,
      subscriptionRowsExpected,
    ] = await Promise.all([
      fetchSingleValue(dataSource, 'SELECT COUNT(*) AS value FROM users'),
      fetchSingleValue(dataSource, 'SELECT COUNT(*) AS value FROM trades'),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(*) AS value
         FROM subscriptions sub
         WHERE sub.status NOT IN (${nonActiveStatusesSql})`,
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(DISTINCT trade."userId") AS value
         FROM trades trade
         WHERE trade."openTime" >= $1`,
        [currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COALESCE(SUM(CASE WHEN ${planExpression} <> 'free' THEN sub.price ELSE 0 END), 0) AS value
         FROM subscriptions sub
         WHERE sub.status IN (${revenueStatusesSql})`,
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COALESCE(SUM(CASE WHEN ${planExpression} <> 'free' THEN sub.price ELSE 0 END), 0) AS value
         FROM subscriptions sub
         WHERE sub."createdAt" >= $1
           AND sub.status IN (${revenueStatusesSql})`,
        [currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COALESCE(SUM(CASE WHEN ${planExpression} <> 'free' THEN sub.price ELSE 0 END), 0) AS value
         FROM subscriptions sub
         WHERE sub."createdAt" >= $1
           AND sub."createdAt" < $2
           AND sub.status IN (${revenueStatusesSql})`,
        [previousStart, currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(*) AS value
         FROM users u
         WHERE u."createdAt" >= $1`,
        [currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(*) AS value
         FROM users u
         WHERE u."createdAt" >= $1 AND u."createdAt" < $2`,
        [previousStart, currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(*) AS value
         FROM trades t
         WHERE t."openTime" >= $1`,
        [currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(*) AS value
         FROM trades t
         WHERE t."openTime" >= $1 AND t."openTime" < $2`,
        [previousStart, currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(DISTINCT t."userId") AS value
         FROM trades t
         WHERE t."openTime" >= $1`,
        [currentStart],
      ),
      fetchSingleValue(
        dataSource,
        `SELECT COUNT(DISTINCT t."userId") AS value
         FROM trades t
         WHERE t."openTime" >= $1 AND t."openTime" < $2`,
        [previousStart, currentStart],
      ),
      dataSource.query(
        `SELECT
           COALESCE(SUM(COALESCE(t."profitOrLoss", 0)), 0) AS "totalPnl",
           SUM(CASE WHEN t.status = $1 AND COALESCE(t."profitOrLoss", 0) > 0 THEN 1 ELSE 0 END) AS "winCount",
           SUM(CASE WHEN t.status = $1 THEN 1 ELSE 0 END) AS "closedCount"
         FROM trades t`,
        [TradeStatus.CLOSED],
      ) as Promise<
        Array<{ totalPnl: string; winCount: string; closedCount: string }>
      >,
      fetchSingleValue(
        dataSource,
        'SELECT COALESCE(SUM(COALESCE(a.balance, 0)), 0) AS value FROM accounts a',
      ),
      dataSource.query(
        `SELECT
           ${planExpression} AS "planKey",
           COUNT(*) AS "count",
           COALESCE(SUM(CASE WHEN ${planExpression} <> 'free' THEN sub.price ELSE 0 END), 0) AS "revenue"
         FROM subscriptions sub
         WHERE sub."createdAt" >= $1
           AND sub.status NOT IN (${nonActiveStatusesSql})
         GROUP BY ${planExpression}
         ORDER BY COUNT(*) DESC`,
        [currentStart],
      ) as Promise<Array<{ planKey: string; count: string; revenue: string }>>,
    ]);

    const winCountExpected = toNumber(tradesSummaryRaw[0]?.winCount);
    const closedCountExpected = toNumber(tradesSummaryRaw[0]?.closedCount);
    const winRateExpected =
      closedCountExpected > 0
        ? Math.round((winCountExpected / closedCountExpected) * 100)
        : 0;
    const monthlyGrowthExpected = percentGrowth(
      currentUsersExpected,
      previousUsersExpected,
    );
    const activeGrowthExpected = percentGrowth(
      currentActiveUsersExpected,
      previousActiveUsersExpected,
    );
    const tradeGrowthExpected = percentGrowth(
      currentTradesExpected,
      previousTradesExpected,
    );
    const revenueGrowthExpected = percentGrowth(
      currentRevenueExpected,
      previousRevenueExpected,
    );

    const checks: MetricCheck[] = [
      {
        name: 'dashboard.totalUsers',
        actual: dashboardStats.totalUsers,
        expected: totalUsersExpected,
      },
      {
        name: 'dashboard.totalTrades',
        actual: dashboardStats.totalTrades,
        expected: totalTradesExpected,
      },
      {
        name: 'dashboard.totalSubscriptions',
        actual: dashboardStats.totalSubscriptions,
        expected: totalSubscriptionsExpected,
      },
      {
        name: 'dashboard.activeUsers',
        actual: dashboardStats.activeUsers,
        expected: activeUsersExpected,
      },
      {
        name: 'dashboard.totalRevenue',
        actual: round(toNumber(dashboardStats.totalRevenue)),
        expected: round(totalRevenueExpected),
        tolerance: 0.01,
      },
      {
        name: 'dashboard.monthlyGrowth',
        actual: round(toNumber(dashboardStats.monthlyGrowth)),
        expected: monthlyGrowthExpected,
        tolerance: 0.01,
      },
      {
        name: 'dashboard.activeGrowth',
        actual: round(toNumber(dashboardStats.activeGrowth)),
        expected: activeGrowthExpected,
        tolerance: 0.01,
      },
      {
        name: 'dashboard.tradeGrowth',
        actual: round(toNumber(dashboardStats.tradeGrowth)),
        expected: tradeGrowthExpected,
        tolerance: 0.01,
      },
      {
        name: 'dashboard.revenueGrowth',
        actual: round(toNumber(dashboardStats.revenueGrowth)),
        expected: revenueGrowthExpected,
        tolerance: 0.01,
      },
      {
        name: 'dashboard.successRate',
        actual: round(toNumber(dashboardStats.successRate)),
        expected: round(
          closedCountExpected > 0
            ? (winCountExpected / closedCountExpected) * 100
            : 0,
        ),
        tolerance: 0.01,
      },
      {
        name: 'trades.summary.totalPnl',
        actual: round(toNumber(tradesView.summary.totalPnl)),
        expected: round(toNumber(tradesSummaryRaw[0]?.totalPnl)),
        tolerance: 0.01,
      },
      {
        name: 'trades.summary.winCount',
        actual: toNumber(tradesView.summary.winCount),
        expected: winCountExpected,
      },
      {
        name: 'trades.summary.closedCount',
        actual: toNumber(tradesView.summary.closedCount),
        expected: closedCountExpected,
      },
      {
        name: 'trades.summary.winRate',
        actual: toNumber(tradesView.summary.winRate),
        expected: winRateExpected,
      },
      {
        name: 'accounts.summary.totalBalance',
        actual: round(toNumber(accountsView.summary.totalBalance)),
        expected: round(accountsSummaryExpected),
        tolerance: 0.01,
      },
    ];

    const failures: string[] = [];
    console.log(`Admin KPI validation run at ${new Date().toISOString()}`);
    for (const check of checks) {
      const tolerance = check.tolerance ?? 0;
      const ok = isWithinTolerance(check.actual, check.expected, tolerance);
      const status = ok ? 'PASS' : 'FAIL';
      console.log(
        `${status} ${check.name} actual=${check.actual} expected=${check.expected} tolerance=${tolerance}`,
      );
      if (!ok) {
        failures.push(check.name);
      }
    }

    const servicePlans = new Map<
      string,
      { count: number; revenue: number; plan: string }
    >();
    for (const row of subscriptionAnalytics.subscriptionDistribution || []) {
      const planKey = normalizePlanKey(row.planKey || row.plan);
      servicePlans.set(planKey, {
        count: toNumber(row.count),
        revenue: round(toNumber(row.revenue)),
        plan: row.plan,
      });
    }

    const dbPlans = new Map<string, { count: number; revenue: number }>();
    for (const row of subscriptionRowsExpected) {
      const planKey = normalizePlanKey(row.planKey);
      dbPlans.set(planKey, {
        count: toNumber(row.count),
        revenue: round(toNumber(row.revenue)),
      });
    }

    const planKeys = new Set([...servicePlans.keys(), ...dbPlans.keys()]);
    for (const planKey of planKeys) {
      const servicePlan = servicePlans.get(planKey) || { count: 0, revenue: 0 };
      const dbPlan = dbPlans.get(planKey) || { count: 0, revenue: 0 };
      const countOk = servicePlan.count === dbPlan.count;
      const revenueOk = isWithinTolerance(servicePlan.revenue, dbPlan.revenue, 0.01);

      const countStatus = countOk ? 'PASS' : 'FAIL';
      const revenueStatus = revenueOk ? 'PASS' : 'FAIL';

      console.log(
        `${countStatus} subscriptions.30d.${planKey}.count actual=${servicePlan.count} expected=${dbPlan.count}`,
      );
      console.log(
        `${revenueStatus} subscriptions.30d.${planKey}.revenue actual=${servicePlan.revenue} expected=${dbPlan.revenue} tolerance=0.01`,
      );

      if (!countOk) failures.push(`subscriptions.30d.${planKey}.count`);
      if (!revenueOk) failures.push(`subscriptions.30d.${planKey}.revenue`);
    }

    if (failures.length > 0) {
      console.error(
        `Validation failed (${failures.length} mismatches): ${failures.join(', ')}`,
      );
      process.exitCode = 1;
      return;
    }

    console.log('Validation passed: all KPI checks are within tolerance.');
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  }
}

main().catch((error) => {
  console.error('Validation script failed to execute:', error);
  process.exitCode = 1;
});
