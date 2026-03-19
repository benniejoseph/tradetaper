import path from 'path';
import request from 'supertest';
import Ajv, { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';
import SwaggerParser from '@apidevtools/swagger-parser';
import openapiSchemaToJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';
import { createHmac } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AdminController } from '../src/admin/admin.controller';
import { AdminService } from '../src/admin/admin.service';
import { AdminGuard } from '../src/auth/guards/admin.guard';
import { RateLimitGuard } from '../src/common/guards/rate-limit.guard';
import { TestUserSeedService } from '../src/seed/test-user-seed.service';
import { User } from '../src/users/entities/user.entity';
import { Account } from '../src/users/entities/account.entity';
import { Trade } from '../src/trades/entities/trade.entity';
import { Subscription } from '../src/subscriptions/entities/subscription.entity';
import { AdminMfaCredential } from '../src/admin/entities/admin-mfa-credential.entity';
import { AdminAuthAuditLog } from '../src/admin/entities/admin-auth-audit-log.entity';

type OpenApiDoc = {
  paths?: Record<
    string,
    Record<string, { responses?: Record<string, { content?: Record<string, { schema?: unknown }> }> }>
  >;
};

type LoginResponse =
  | {
      access_token: string;
      role: string;
      mfaVerified?: boolean;
    }
  | {
      mfaRequired: true;
      challengeMethod: string;
      challengeToken: string;
    }
  | {
      mfaEnrollmentRequired: true;
      challengeMethod: string;
      bootstrapToken: string;
      manualEntryKey: string;
      qrCodeDataUrl: string;
      otpauthUrl: string;
    };

const OPENAPI_CONTRACT_PATH = path.resolve(
  __dirname,
  '../../tradetaper-admin/openapi/admin-contracts.yaml',
);
const liveEnabled = ['1', 'true', 'yes', 'on'].includes(
  (process.env.ADMIN_E2E_LIVE || '').trim().toLowerCase(),
);

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (typeof value !== 'string') {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function decodeBase32Secret(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = secret.toUpperCase().replace(/\s+/g, '').replace(/=+$/, '');
  const bytes: number[] = [];
  let bitBuffer = 0;
  let bitLength = 0;

  for (const char of normalized) {
    const value = alphabet.indexOf(char);
    if (value === -1) {
      throw new Error('ADMIN_E2E_TOTP_SECRET_BASE32 is not valid base32');
    }
    bitBuffer = (bitBuffer << 5) | value;
    bitLength += 5;
    if (bitLength >= 8) {
      bitLength -= 8;
      bytes.push((bitBuffer >> bitLength) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

function generateTotpCode(secretBase32: string, stepSeconds: number = 30): string {
  const secret = decodeBase32Secret(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / stepSeconds);
  const counterBuffer = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuffer.writeUInt32BE(high, 0);
  counterBuffer.writeUInt32BE(low, 4);

  const digest = createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 1_000_000).toString().padStart(6, '0');
}

const describeLive = liveEnabled ? describe : describe.skip;

describeLive('Admin Live HTTP E2E (login + MFA + contract routes)', () => {
  const ajv = new Ajv({ strict: false, allErrors: true });
  addFormats(ajv);

  let openApiDocument: OpenApiDoc;
  let agent: ReturnType<typeof request.agent>;
  let app: INestApplication | null = null;
  let moduleRef: TestingModule | null = null;
  let db: DataSource | null = null;

  let apiPrefix: string;
  let adminEmail: string;
  let adminPassword: string;
  let expectMfa: boolean;
  let allowBootstrap: boolean;
  let totpSecretBase32: string | null;
  let recoveryCode: string | null;
  let adminAccessToken: string | null = null;
  let knownUserId: string | null = null;
  let knownTable: string | null = null;
  const inprocessMode = parseBoolean(process.env.ADMIN_E2E_INPROCESS, false);

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

  const authorizedGet = (url: string) => {
    const req = agent.get(url);
    if (adminAccessToken) {
      req.set('Authorization', `Bearer ${adminAccessToken}`);
    }
    return req;
  };

  async function loginAndVerifyMfa(): Promise<void> {
    const loginResponse = await agent
      .post(`${apiPrefix}/admin/auth/login`)
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    const loginBody = loginResponse.body as LoginResponse;

    if ('access_token' in loginBody) {
      adminAccessToken = loginBody.access_token;
      if (expectMfa && loginBody.mfaVerified !== true) {
        throw new Error(
          'MFA was expected but login completed without MFA verification. Set ADMIN_E2E_EXPECT_MFA=false if intentional.',
        );
      }
      return;
    }

    if ('mfaEnrollmentRequired' in loginBody) {
      if (!allowBootstrap) {
        throw new Error(
          'MFA enrollment is required. Re-run with ADMIN_E2E_ALLOW_BOOTSTRAP=true for this environment.',
        );
      }

      const enrollmentOtp = generateTotpCode(loginBody.manualEntryKey);
      const bootstrapResponse = await agent
        .post(`${apiPrefix}/admin/auth/mfa/bootstrap/complete`)
        .send({
          bootstrapToken: loginBody.bootstrapToken,
          otpCode: enrollmentOtp,
        })
        .expect(200);
      expect(bootstrapResponse.body?.mfaVerified).toBe(true);
      expect(typeof bootstrapResponse.body?.access_token).toBe('string');
      adminAccessToken = bootstrapResponse.body.access_token;
      totpSecretBase32 = loginBody.manualEntryKey;
      return;
    }

    if ('mfaRequired' in loginBody) {
      if (!expectMfa) {
        throw new Error('MFA challenge returned while ADMIN_E2E_EXPECT_MFA=false.');
      }

      if (totpSecretBase32) {
        const otpCode = generateTotpCode(totpSecretBase32);
        const verifyResponse = await agent
          .post(`${apiPrefix}/admin/auth/verify-mfa`)
          .send({
            challengeToken: loginBody.challengeToken,
            otpCode,
          })
          .expect(200);
        expect(verifyResponse.body?.mfaVerified).toBe(true);
        expect(typeof verifyResponse.body?.access_token).toBe('string');
        adminAccessToken = verifyResponse.body.access_token;
        return;
      }

      if (recoveryCode) {
        const verifyResponse = await agent
          .post(`${apiPrefix}/admin/auth/verify-mfa`)
          .send({
            challengeToken: loginBody.challengeToken,
            recoveryCode,
          })
          .expect(200);
        expect(verifyResponse.body?.mfaVerified).toBe(true);
        expect(typeof verifyResponse.body?.access_token).toBe('string');
        adminAccessToken = verifyResponse.body.access_token;
        if (typeof verifyResponse.body?.recoveryCodesRemaining === 'number') {
          recoveryCode = null;
        }
        return;
      }

      throw new Error(
        'MFA challenge received but no ADMIN_E2E_TOTP_SECRET_BASE32 or ADMIN_E2E_RECOVERY_CODE provided.',
      );
    }
  }

  beforeAll(async () => {
    apiPrefix = (process.env.ADMIN_E2E_API_PREFIX || '/api/v1').trim() || '/api/v1';
    expectMfa = parseBoolean(process.env.ADMIN_E2E_EXPECT_MFA, true);
    allowBootstrap = parseBoolean(process.env.ADMIN_E2E_ALLOW_BOOTSTRAP, false);
    totpSecretBase32 = (process.env.ADMIN_E2E_TOTP_SECRET_BASE32 || '').trim() || null;
    recoveryCode = (process.env.ADMIN_E2E_RECOVERY_CODE || '').trim() || null;

    if (inprocessMode) {
      adminEmail =
        (process.env.ADMIN_E2E_EMAIL || '').trim() ||
        `admin-e2e-${Date.now()}@tradetaper.com`;
      adminPassword = (process.env.ADMIN_E2E_PASSWORD || '').trim() || 'admin123';

      process.env.NODE_ENV = process.env.NODE_ENV || 'test';
      process.env.ADMIN_EMAIL = adminEmail;
      process.env.ADMIN_PASSWORD = adminPassword;
      process.env.ADMIN_PASSWORD_HASH = '';
      process.env.ADMIN_REQUIRE_MFA = expectMfa ? 'true' : 'false';
      process.env.ADMIN_MFA_ENCRYPTION_KEY =
        process.env.ADMIN_MFA_ENCRYPTION_KEY ||
        'lTIn+OaIubzKIZNrL9jpReB1+HhjsgVx1BbdiZDevsY=';
      process.env.ADMIN_MFA_RECOVERY_CODE_PEPPER =
        process.env.ADMIN_MFA_RECOVERY_CODE_PEPPER ||
        'qqUbg1J+7bqKsVe5YtORs3R69w9kRpeuI5Lykp29nlk=';
      process.env.ADMIN_MFA_ISSUER = process.env.ADMIN_MFA_ISSUER || 'TradeTaper Admin';
      process.env.ADMIN_JWT_SECRET =
        process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'test-admin-jwt-secret';

      const dbHost =
        process.env.ADMIN_E2E_DB_HOST ||
        process.env.DB_POOLER_HOST ||
        process.env.DB_HOST;
      const dbPort = Number(
        process.env.ADMIN_E2E_DB_PORT ||
          process.env.DB_POOLER_PORT ||
          process.env.DB_PORT ||
          '5432',
      );
      const dbUser =
        process.env.ADMIN_E2E_DB_USER ||
        process.env.DB_USER_CANDIDATES?.split(',')?.map((s) => s.trim())?.find(Boolean) ||
        process.env.DB_USER ||
        process.env.DB_USERNAME;
      const dbPassword = process.env.ADMIN_E2E_DB_PASSWORD || process.env.DB_PASSWORD;
      const dbName =
        process.env.ADMIN_E2E_DB_NAME ||
        process.env.DB_DATABASE ||
        process.env.DB_NAME ||
        'postgres';
      const dbSsl = parseBoolean(
        process.env.ADMIN_E2E_DB_SSL || process.env.DB_SSL,
        true,
      );

      if (!dbHost || !dbUser || !dbPassword || !Number.isFinite(dbPort)) {
        throw new Error(
          'In-process mode requires DB connectivity env values (host/user/password/port).',
        );
      }

      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true }),
          CacheModule.register({ ttl: 600 }),
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: dbHost,
            port: dbPort,
            username: dbUser,
            password: dbPassword,
            database: dbName,
            ssl: dbSsl ? { rejectUnauthorized: false } : false,
            entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
            synchronize: false,
            logging: false,
          }),
          TypeOrmModule.forFeature([
            User,
            Account,
            Trade,
            Subscription,
            AdminMfaCredential,
            AdminAuthAuditLog,
          ]),
          JwtModule.register({
            secret: process.env.ADMIN_JWT_SECRET,
            signOptions: {
              expiresIn: process.env.ADMIN_ACCESS_TOKEN_TTL || '8h',
            },
          }),
        ],
        controllers: [AdminController],
        providers: [
          AdminService,
          AdminGuard,
          RateLimitGuard,
          {
            provide: TestUserSeedService,
            useValue: {
              createTestUser: jest.fn(),
              deleteTestUser: jest.fn(),
            },
          },
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      const prefix = apiPrefix.replace(/^\/+/, '');
      app.setGlobalPrefix(prefix);
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
      db = moduleRef.get(DataSource);
      agent = request.agent(app.getHttpServer());
    } else {
      const baseUrl = (process.env.ADMIN_E2E_BASE_URL || 'https://api.tradetaper.com').trim();
      adminEmail = (
        process.env.ADMIN_E2E_EMAIL ||
        process.env.ADMIN_EMAIL ||
        ''
      ).trim();
      adminPassword = (process.env.ADMIN_E2E_PASSWORD || '').trim();

      if (!adminEmail) {
        throw new Error('ADMIN_E2E_EMAIL (or ADMIN_EMAIL) is required for live admin e2e.');
      }
      if (!adminPassword) {
        throw new Error('ADMIN_E2E_PASSWORD is required for live admin e2e.');
      }

      agent = request.agent(baseUrl);
    }

    const dereferenced = await SwaggerParser.dereference(OPENAPI_CONTRACT_PATH);
    openApiDocument = dereferenced as OpenApiDoc;
  }, 120_000);

  afterAll(async () => {
    if (db && inprocessMode) {
      try {
        await db.query(
          'DELETE FROM admin_mfa_credentials WHERE "adminEmail" = $1',
          [adminEmail],
        );
        await db.query(
          'DELETE FROM admin_auth_audit_logs WHERE "adminEmail" = $1',
          [adminEmail],
        );
      } catch {
        // Non-fatal cleanup.
      }
    }

    if (app) {
      await app.close();
    }
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it(
    'completes login and MFA verification over HTTP',
    async () => {
      await loginAndVerifyMfa();

      const mfaStatusResponse = await authorizedGet(`${apiPrefix}/admin/auth/mfa/status`).expect(200);
      expect(mfaStatusResponse.body).toEqual(
        expect.objectContaining({
          mfaRequired: expect.any(Boolean),
          enrolled: expect.any(Boolean),
        }),
      );
    },
    120_000,
  );

  it(
    'validates live admin read routes against OpenAPI contracts',
    async () => {
      const dashboardResponse = await authorizedGet(`${apiPrefix}/admin/dashboard/stats`).expect(200);
      assertResponseMatchesContract('/admin/dashboard/stats', 'get', dashboardResponse.body);

      const userAnalyticsResponse = await authorizedGet(`${apiPrefix}/admin/user-analytics/30d`).expect(200);
      assertResponseMatchesContract(
        '/admin/user-analytics/{timeRange}',
        'get',
        userAnalyticsResponse.body,
      );

      const revenueAnalyticsResponse = await authorizedGet(`${apiPrefix}/admin/revenue-analytics/30d`).expect(200);
      assertResponseMatchesContract(
        '/admin/revenue-analytics/{timeRange}',
        'get',
        revenueAnalyticsResponse.body,
      );

      const systemHealthResponse = await authorizedGet(`${apiPrefix}/admin/system-health`).expect(200);
      assertResponseMatchesContract('/admin/system-health', 'get', systemHealthResponse.body);

      const activityFeedResponse = await authorizedGet(`${apiPrefix}/admin/activity-feed?limit=5`).expect(200);
      assertResponseMatchesContract('/admin/activity-feed', 'get', activityFeedResponse.body);

      const subscriptionAnalyticsResponse = await authorizedGet(
        `${apiPrefix}/admin/subscription/analytics?timeRange=30d`,
      ).expect(200);
      assertResponseMatchesContract(
        '/admin/subscription/analytics',
        'get',
        subscriptionAnalyticsResponse.body,
      );

      const usersResponse = await authorizedGet(`${apiPrefix}/admin/users?page=1&limit=20`).expect(200);
      assertResponseMatchesContract('/admin/users', 'get', usersResponse.body);
      knownUserId =
        Array.isArray(usersResponse.body?.data) && usersResponse.body.data.length > 0
          ? String(usersResponse.body.data[0].id)
          : null;

      if (knownUserId) {
        const userDetailResponse = await authorizedGet(`${apiPrefix}/admin/users/${knownUserId}`).expect(200);
        assertResponseMatchesContract('/admin/users/{userId}', 'get', userDetailResponse.body);
      }

      const tradesResponse = await authorizedGet(`${apiPrefix}/admin/trades?page=1&limit=50`).expect(200);
      assertResponseMatchesContract('/admin/trades', 'get', tradesResponse.body);

      const accountsResponse = await authorizedGet(`${apiPrefix}/admin/accounts?page=1&limit=50`).expect(200);
      assertResponseMatchesContract('/admin/accounts', 'get', accountsResponse.body);

      const subscriptionsResponse = await authorizedGet(`${apiPrefix}/admin/subscriptions?page=1&limit=50`).expect(200);
      assertResponseMatchesContract('/admin/subscriptions', 'get', subscriptionsResponse.body);

      const auditLogsResponse = await authorizedGet(`${apiPrefix}/admin/auth/audit-logs?limit=20&offset=0`).expect(200);
      assertResponseMatchesContract('/admin/auth/audit-logs', 'get', auditLogsResponse.body);

      const sessionResponse = await authorizedGet(`${apiPrefix}/admin/auth/me`).expect(200);
      assertResponseMatchesContract('/admin/auth/me', 'get', sessionResponse.body);

      const logsResponse = await authorizedGet(`${apiPrefix}/admin/logs?limit=50&offset=0`).expect(200);
      assertResponseMatchesContract('/admin/logs', 'get', logsResponse.body);

      const logStreamResponse = await authorizedGet(`${apiPrefix}/admin/logs/stream`).expect(200);
      assertResponseMatchesContract('/admin/logs/stream', 'get', logStreamResponse.body);

      const performanceResponse = await authorizedGet(
        `${apiPrefix}/admin/analytics/performance?timeRange=1h`,
      ).expect(200);
      assertResponseMatchesContract(
        '/admin/analytics/performance',
        'get',
        performanceResponse.body,
      );

      const usageResponse = await authorizedGet(`${apiPrefix}/admin/api/usage?timeRange=24h`).expect(200);
      assertResponseMatchesContract('/admin/api/usage', 'get', usageResponse.body);

      const tablesResponse = await authorizedGet(`${apiPrefix}/admin/database/tables`).expect(200);
      assertResponseMatchesContract('/admin/database/tables', 'get', tablesResponse.body);
      knownTable =
        Array.isArray(tablesResponse.body) && tablesResponse.body.length > 0
          ? String(tablesResponse.body.includes('users') ? 'users' : tablesResponse.body[0])
          : null;

      if (knownTable) {
        const columnsResponse = await authorizedGet(`${apiPrefix}/admin/database/columns/${knownTable}`).expect(200);
        assertResponseMatchesContract('/admin/database/columns/{table}', 'get', columnsResponse.body);

        const rowsResponse = await authorizedGet(
          `${apiPrefix}/admin/database/rows/${knownTable}?page=1&limit=20`,
        ).expect(200);
        assertResponseMatchesContract('/admin/database/rows/{table}', 'get', rowsResponse.body);
      }
    },
    180_000,
  );

  it('logs out cleanly', async () => {
    const logoutRequest = agent.post(`${apiPrefix}/admin/auth/logout`);
    if (adminAccessToken) {
      logoutRequest.set('Authorization', `Bearer ${adminAccessToken}`);
    }
    const logoutResponse = await logoutRequest.expect(200);
    expect(logoutResponse.body).toEqual({ success: true });
  });
});
