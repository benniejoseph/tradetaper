import { Test, TestingModule } from '@nestjs/testing';
import path from 'path';
import Ajv, { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';
import SwaggerParser from '@apidevtools/swagger-parser';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminController } from '../src/admin/admin.controller';
import { AdminService } from '../src/admin/admin.service';
import { TestUserSeedService } from '../src/seed/test-user-seed.service';
import { AdminMfaCredential } from '../src/admin/entities/admin-mfa-credential.entity';
import { AdminAuthAuditLog } from '../src/admin/entities/admin-auth-audit-log.entity';

type OpenApiDoc = {
  paths?: Record<
    string,
    Record<string, { responses?: Record<string, { content?: Record<string, { schema?: unknown }> }> }>
  >;
};

const OPENAPI_CONTRACT_PATH = path.resolve(
  __dirname,
  '../../tradetaper-admin/openapi/admin-contracts.yaml',
);

const mockAdminService: Partial<Record<keyof AdminService, jest.Mock>> = {
  getDashboardStats: jest.fn().mockResolvedValue({
    totalUsers: 112,
    userGrowth: 8.5,
    activeUsers: 47,
    activeGrowth: 6.2,
    totalRevenue: 12420.55,
    revenueGrowth: 12.4,
    totalTrades: 389,
    tradeGrowth: 4.8,
    totalSubscriptions: 34,
    avgTradesPerUser: 3.47,
    successRate: 58.2,
    monthlyGrowth: 8.5,
  }),
  getUserAnalytics: jest.fn().mockResolvedValue({
    labels: ['2026-03-17', '2026-03-18', '2026-03-19'],
    values: [3, 5, 2],
    data: [
      { date: '2026-03-17', users: 3 },
      { date: '2026-03-18', users: 5 },
      { date: '2026-03-19', users: 2 },
    ],
  }),
  getRevenueAnalytics: jest.fn().mockResolvedValue({
    labels: ['2026-03-17', '2026-03-18', '2026-03-19'],
    values: [199, 299, 499],
    data: [
      { date: '2026-03-17', revenue: 199 },
      { date: '2026-03-18', revenue: 299 },
      { date: '2026-03-19', revenue: 499 },
    ],
  }),
  getSystemHealth: jest.fn().mockResolvedValue({
    status: 'healthy',
    uptime: 99.9,
    responseTime: 45,
    memoryUsage: 62,
    cpuUsage: 28,
    cacheHitRate: 94,
  }),
  getActivityFeed: jest.fn().mockResolvedValue([
    {
      id: 'trade-1',
      type: 'trade_created',
      description: 'New trade opened on EURUSD',
      timestamp: '2026-03-19T08:00:00.000Z',
      user: { id: 'user-1', name: 'Alex' },
    },
  ]),
  getSubscriptionAnalytics: jest.fn().mockResolvedValue({
    subscriptionDistribution: [
      { plan: 'Free', planKey: 'free', count: 10, revenue: 0, color: '#6B7280', price: 0 },
      {
        plan: 'Premium',
        planKey: 'premium',
        count: 24,
        revenue: 12420.55,
        color: '#22D3EE',
        price: 517.52,
      },
    ],
  }),
  getUsers: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'user-1',
        email: 'alex@example.com',
        firstName: 'Alex',
        lastName: 'Stone',
        createdAt: '2026-03-10T00:00:00.000Z',
        updatedAt: '2026-03-18T00:00:00.000Z',
        isEmailVerified: true,
        subscription: {
          plan: 'Premium',
          planKey: 'premium',
          status: 'active',
          price: 499,
        },
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  }),
  getUserDetail: jest.fn().mockResolvedValue({
    user: {
      id: 'user-1',
      email: 'alex@example.com',
      firstName: 'Alex',
      createdAt: '2026-03-10T00:00:00.000Z',
    },
    trades: [
      {
        id: 'trade-1',
        symbol: 'EURUSD',
        side: 'buy',
        status: 'closed',
        openPrice: 1.083,
        closePrice: 1.087,
        profitOrLoss: 40,
        createdAt: '2026-03-18T00:00:00.000Z',
        user: { id: 'user-1', email: 'alex@example.com' },
      },
    ],
    tradeCount: 1,
    accounts: [
      {
        id: 'acct-1',
        name: 'Primary',
        balance: 10234.22,
        currency: 'USD',
        createdAt: '2026-03-01T00:00:00.000Z',
        user: { id: 'user-1', email: 'alex@example.com' },
      },
    ],
    accountCount: 1,
    totalPnl: 40,
  }),
  getTrades: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'trade-1',
        symbol: 'EURUSD',
        side: 'buy',
        status: 'closed',
        openPrice: 1.083,
        closePrice: 1.087,
        profitOrLoss: 40,
        createdAt: '2026-03-18T00:00:00.000Z',
        user: { id: 'user-1', email: 'alex@example.com' },
      },
    ],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
    summary: {
      totalPnl: 40,
      winRate: 100,
      winCount: 1,
      closedCount: 1,
    },
  }),
  getAccounts: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'acct-1',
        name: 'Primary',
        balance: 10234.22,
        currency: 'USD',
        createdAt: '2026-03-01T00:00:00.000Z',
        user: { id: 'user-1', email: 'alex@example.com' },
      },
    ],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
    summary: {
      totalBalance: 10234.22,
    },
  }),
  getSubscriptions: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'sub-1',
        plan: 'Premium',
        planKey: 'premium',
        status: 'active',
        price: 499,
        createdAt: '2026-03-01T00:00:00.000Z',
        user: { id: 'user-1', email: 'alex@example.com' },
      },
    ],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
    summary: {
      activeCount: 1,
    },
  }),
  getDatabaseTables: jest.fn().mockResolvedValue(['users']),
  getDatabaseColumns: jest.fn().mockResolvedValue([
    {
      column_name: 'id',
      data_type: 'uuid',
      is_nullable: 'NO',
      column_default: null,
    },
  ]),
  getDatabaseRows: jest.fn().mockResolvedValue({
    data: [{ id: 'user-1', email: 'alex@example.com' }],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  }),
  getSystemLogs: jest.fn().mockResolvedValue({
    data: [
      {
        id: 'log-1',
        level: 'info',
        message: 'GET /api/v1/admin/dashboard/stats -> 200 (32ms)',
        context: 'ApiCall',
        details: {
          method: 'GET',
          endpoint: '/api/v1/admin/dashboard/stats',
          statusCode: 200,
          responseTime: 32,
        },
        timestamp: '2026-03-19T00:00:00.000Z',
        endpoint: '/api/v1/admin/dashboard/stats',
        method: 'GET',
      },
    ],
    total: 1,
    limit: 100,
    offset: 0,
  }),
  getPerformanceMetrics: jest.fn().mockResolvedValue({
    data: [
      {
        timestamp: '2026-03-19T00:00:00.000Z',
        responseTime: 42,
        throughput: 21,
        errorRate: 0,
        cpuUsage: 25,
        memoryUsage: 62,
      },
    ],
  }),
  getApiUsageStats: jest.fn().mockResolvedValue({
    totalRequests: 128,
    requestsByEndpoint: [
      {
        endpoint: '/api/v1/admin/dashboard/stats',
        count: 40,
        avgResponseTime: 43.2,
      },
    ],
    requestsByMethod: [
      {
        method: 'GET',
        count: 120,
        percentage: 93.75,
      },
      {
        method: 'POST',
        count: 8,
        percentage: 6.25,
      },
    ],
    timeRange: '24h',
  }),
};

const authAuditSeed = [
  {
    id: 'audit-1',
    eventType: 'login',
    outcome: 'success' as const,
    adminEmail: 'admin@tradetaper.com',
    createdAt: '2026-03-19T00:00:00.000Z',
  },
  {
    id: 'audit-2',
    eventType: 'verify-mfa',
    outcome: 'failure' as const,
    adminEmail: 'admin@tradetaper.com',
    reason: 'invalid_otp',
    createdAt: '2026-03-19T00:01:00.000Z',
  },
];

function buildAuditLogRepository() {
  return {
    createQueryBuilder: jest.fn(() => {
      const state: { eventType?: string; outcome?: 'success' | 'failure'; skip: number; take: number } = {
        skip: 0,
        take: 50,
      };

      const queryBuilder = {
        andWhere: jest.fn((query: string, params: Record<string, unknown>) => {
          if (query.includes('eventType')) state.eventType = params.eventType as string;
          if (query.includes('outcome')) state.outcome = params.outcome as 'success' | 'failure';
          return queryBuilder;
        }),
        orderBy: jest.fn(() => queryBuilder),
        skip: jest.fn((value: number) => {
          state.skip = value;
          return queryBuilder;
        }),
        take: jest.fn((value: number) => {
          state.take = value;
          return queryBuilder;
        }),
        getManyAndCount: jest.fn(async () => {
          const filtered = authAuditSeed.filter((row) => {
            if (state.eventType && row.eventType !== state.eventType) return false;
            if (state.outcome && row.outcome !== state.outcome) return false;
            return true;
          });
          const data = filtered.slice(state.skip, state.skip + state.take);
          return [data, filtered.length] as const;
        }),
      };

      return queryBuilder;
    }),
    save: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
  };
}

describe('Admin Contract (controller scaffold)', () => {
  let moduleRef: TestingModule;
  let controller: AdminController;
  let openApiDocument: OpenApiDoc;
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);

  const assertResponseMatchesContract = (
    contractPath: string,
    method: 'get' | 'post',
    payload: unknown,
  ) => {
    const schema =
      openApiDocument.paths?.[contractPath]?.[method]?.responses?.['200']?.content?.[
        'application/json'
      ]?.schema;
    expect(schema).toBeDefined();

    const jsonSchema = openapiSchemaToJsonSchema(schema as Record<string, unknown>, {
      cloneSchema: true,
    }) as AnySchema;
    if (typeof jsonSchema === 'object' && jsonSchema !== null && '$schema' in jsonSchema) {
      delete (jsonSchema as Record<string, unknown>).$schema;
    }
    const validate = ajv.compile(jsonSchema);
    const isValid = validate(payload);
    if (!isValid) {
      const formattedErrors = ajv.errorsText(validate.errors, { separator: '\n' });
      throw new Error(
        `Contract validation failed for ${method.toUpperCase()} ${contractPath}\n${formattedErrors}`,
      );
    }
  };

  beforeAll(async () => {
    const dereferenced = await SwaggerParser.dereference(OPENAPI_CONTRACT_PATH);
    openApiDocument = dereferenced as OpenApiDoc;

    moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        {
          provide: TestUserSeedService,
          useValue: {
            createTestUser: jest.fn(),
            deleteTestUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => 'test-admin-token'),
            verify: jest.fn(() => ({ role: 'admin', email: 'admin@tradetaper.com' })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
        {
          provide: getRepositoryToken(AdminMfaCredential),
          useValue: {
            findOneBy: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AdminAuthAuditLog),
          useValue: buildAuditLogRepository(),
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AdminController);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('validates GET /admin/dashboard/stats', async () => {
    const payload = await controller.getDashboardStats();
    assertResponseMatchesContract('/admin/dashboard/stats', 'get', payload);
  });

  it('validates GET /admin/user-analytics/:timeRange', async () => {
    const payload = await controller.getUserAnalytics('30d');
    assertResponseMatchesContract('/admin/user-analytics/{timeRange}', 'get', payload);
  });

  it('validates GET /admin/revenue-analytics/:timeRange', async () => {
    const payload = await controller.getRevenueAnalytics('30d');
    assertResponseMatchesContract('/admin/revenue-analytics/{timeRange}', 'get', payload);
  });

  it('validates GET /admin/system-health', async () => {
    const payload = await controller.getSystemHealth();
    assertResponseMatchesContract('/admin/system-health', 'get', payload);
  });

  it('validates GET /admin/activity-feed', async () => {
    const payload = await controller.getActivityFeed('5');
    assertResponseMatchesContract('/admin/activity-feed', 'get', payload);
  });

  it('validates GET /admin/subscription/analytics', async () => {
    const payload = await controller.getSubscriptionAnalytics('30d');
    assertResponseMatchesContract('/admin/subscription/analytics', 'get', payload);
  });

  it('validates GET /admin/users', async () => {
    const payload = await controller.getUsers('1', '20');
    assertResponseMatchesContract('/admin/users', 'get', payload);
  });

  it('validates GET /admin/users/:id', async () => {
    const payload = await controller.getUserDetail('user-1');
    assertResponseMatchesContract('/admin/users/{userId}', 'get', payload);
  });

  it('validates GET /admin/trades', async () => {
    const payload = await controller.getTrades('1', '50');
    assertResponseMatchesContract('/admin/trades', 'get', payload);
  });

  it('validates GET /admin/accounts', async () => {
    const payload = await controller.getAccounts('1', '50');
    assertResponseMatchesContract('/admin/accounts', 'get', payload);
  });

  it('validates GET /admin/subscriptions', async () => {
    const payload = await controller.getSubscriptions('1', '50');
    assertResponseMatchesContract('/admin/subscriptions', 'get', payload);
  });

  it('validates GET /admin/auth/audit-logs', async () => {
    const payload = await controller.getAdminAuthAuditLogs('2', '0');
    assertResponseMatchesContract('/admin/auth/audit-logs', 'get', payload);
  });

  it('validates GET /admin/auth/me', async () => {
    const payload = await controller.getAdminSession({
      user: {
        email: 'admin@tradetaper.com',
        role: 'admin',
        adminRole: 'super-admin',
        mfa: true,
      },
    } as any);
    assertResponseMatchesContract('/admin/auth/me', 'get', payload);
  });

  it('validates GET /admin/logs', async () => {
    const payload = await controller.getLogs('100', '0');
    assertResponseMatchesContract('/admin/logs', 'get', payload);
  });

  it('validates GET /admin/logs/stream', async () => {
    const payload = await controller.getLogsStream();
    assertResponseMatchesContract('/admin/logs/stream', 'get', payload);
  });

  it('validates GET /admin/analytics/performance', async () => {
    const payload = await controller.getPerformanceMetrics('1h');
    assertResponseMatchesContract('/admin/analytics/performance', 'get', payload);
  });

  it('validates GET /admin/api/usage', async () => {
    const payload = await controller.getApiUsageStats('24h');
    assertResponseMatchesContract('/admin/api/usage', 'get', payload);
  });

  it('validates GET /admin/database/tables', async () => {
    const payload = await controller.getDatabaseTables();
    assertResponseMatchesContract('/admin/database/tables', 'get', payload);
  });

  it('validates GET /admin/database/columns/:table', async () => {
    const payload = await controller.getDatabaseColumns('users');
    assertResponseMatchesContract('/admin/database/columns/{table}', 'get', payload);
  });

  it('validates GET /admin/database/rows/:table', async () => {
    const payload = await controller.getDatabaseRows('users', '1', '20');
    assertResponseMatchesContract('/admin/database/rows/{table}', 'get', payload);
  });
});
