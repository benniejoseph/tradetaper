import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL } from './api-base-url';
import type { components } from './generated/admin-contracts';

type AdminContractSchemas = components['schemas'];

// Types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  type: 'login' | 'trade_created' | 'trade_closed' | 'subscription_changed' | 'image_uploaded';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  location?: string;
}

export type AnalyticsData = AdminContractSchemas['AnalyticsData'];
export type AdminRole = AdminContractSchemas['AdminRole'];
export type AdminSession = AdminContractSchemas['AdminSession'];

export type TradeAnalyticsData = AnalyticsData & {
  topTradingPairs: TradingPair[];
};

export type SubscriptionAnalytics = AdminContractSchemas['SubscriptionAnalytics'];

export type SystemHealth = AdminContractSchemas['SystemHealth'];

export interface GeographicData {
  country: string;
  users: number;
  trades: number;
  revenue: number;
  coordinates: [number, number];
}

export type AdminUserReference = AdminContractSchemas['AdminUserReference'];

export type AdminUserSubscription = AdminContractSchemas['AdminUserSubscription'];

export type AdminUserRecord = AdminContractSchemas['AdminUserRecord'];

export type AdminTradeRecord = AdminContractSchemas['AdminTradeRecord'];

export type AdminAccountRecord = AdminContractSchemas['AdminAccountRecord'];

export type AdminSubscriptionRecord = AdminContractSchemas['AdminSubscriptionRecord'];

export type UsersResponse = AdminContractSchemas['UsersResponse'];

export interface DailyStats {
  date: string;
  users: number;
  trades: number;
  revenue: number;
  signups: number;
}

export interface TradingPair {
  pair: string;
  count: number;
  volume: number;
}

export interface SubscriptionData {
  plan: string;
  count: number;
  revenue: number;
}

export type DashboardStats = AdminContractSchemas['DashboardStats'];

export type Activity = AdminContractSchemas['ActivityItem'];

export type LogEntry = AdminContractSchemas['AdminSystemLogEntry'];
export type LogsResponse = AdminContractSchemas['AdminSystemLogsResponse'];

export interface SystemDiagnostics {
  database: {
    status: string;
    connectionCount: number;
    queryTime: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
}

export type PerformanceMetrics = AdminContractSchemas['PerformanceMetricsResponse'];

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Array<{ type: string; count: number }>;
  errorsByEndpoint: Array<{ endpoint: string; count: number }>;
  timeRange: string;
}

export type ApiUsageStats = AdminContractSchemas['ApiUsageStats'];

export interface AdminPaginatedResponse<TItem, TSummary = Record<string, unknown>> {
  data: TItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary?: TSummary;
}

export type AdminTradesSummary = AdminContractSchemas['AdminTradesSummary'];

export type AdminAccountsSummary = AdminContractSchemas['AdminAccountsSummary'];

export type AdminSubscriptionsSummary = AdminContractSchemas['AdminSubscriptionsSummary'];

export type AdminUserDetailResponse = AdminContractSchemas['AdminUserDetailResponse'];

export type AdminAuthAuditLogEntry = AdminContractSchemas['AdminAuthAuditLogEntry'];

export type AdminAuthAuditLogsResponse = AdminContractSchemas['AdminAuthAuditLogsResponse'];

export type AdminTradesResponse = AdminContractSchemas['AdminTradesResponse'];

export type AdminAccountsResponse = AdminContractSchemas['AdminAccountsResponse'];

export type AdminSubscriptionsResponse = AdminContractSchemas['AdminSubscriptionsResponse'];

export type DatabaseColumn = AdminContractSchemas['DatabaseColumn'];

export type DatabaseRow = AdminContractSchemas['DatabaseRow'];

export type DatabaseRowsResponse = AdminContractSchemas['DatabaseRowsResponse'];

export type SqlQueryRequest = AdminContractSchemas['SqlQueryRequest'];

export type SqlQueryResponse = AdminContractSchemas['SqlQueryResponse'];

export interface AdminTestEndpointRequest {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string>;
}

export interface AdminTestEndpointResponse {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: unknown;
}

export interface AdminDebugSession {
  id?: string;
  description?: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AdminBackupStatus {
  status?: string;
  backupId?: string;
  startedAt?: string;
  completedAt?: string;
  message?: string;
  [key: string]: unknown;
}

export const ADMIN_API_CAPABILITY_MAP = {
  dashboardStats: '/admin/dashboard/stats',
  userAnalytics: '/admin/user-analytics/:timeRange',
  revenueAnalytics: '/admin/revenue-analytics/:timeRange',
  systemHealth: '/admin/system-health',
  activityFeed: '/admin/activity-feed',
  subscriptionAnalytics: '/admin/subscription/analytics',
  users: '/admin/users',
  userDetail: '/admin/users/:id',
  trades: '/admin/trades',
  accounts: '/admin/accounts',
  subscriptions: '/admin/subscriptions',
  authAuditLogs: '/admin/auth/audit-logs',
  adminSession: '/admin/auth/me',
  mfaStatus: '/admin/auth/mfa/status',
  systemLogs: '/admin/logs',
  logStream: '/admin/logs/stream',
  performanceMetrics: '/admin/analytics/performance',
  apiUsageStats: '/admin/api/usage',
  databaseTables: '/admin/database/tables',
  databaseColumns: '/admin/database/columns/:table',
  databaseRows: '/admin/database/rows/:table',
  databaseTableStats: '/admin/database/table-stats',
  databaseRunSql: '/admin/database/run-sql',
} as const;

interface CsrfAwareRequestConfig extends InternalAxiosRequestConfig {
  _csrfRetry?: boolean;
}

class AdminApi {
  private baseUrl: string;
  private axiosInstance!: AxiosInstance;
  private csrfToken: string | null = null;
  private csrfBootstrapPromise: Promise<string | null> | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.initializeAxios();
    if (typeof window !== 'undefined') {
      void this.bootstrapCsrfToken();
    }
  }

  private initializeAxios() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(
      async (config: CsrfAwareRequestConfig) => {
        if (!this.shouldAttachCsrfToken(config)) {
          return config;
        }

        const token = await this.bootstrapCsrfToken();
        if (!token) {
          return config;
        }

        this.setCsrfHeader(config, token);
        return config;
      },
    );

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const request = error?.config as CsrfAwareRequestConfig | undefined;
        const status = error?.response?.status;

        if (
          status === 403 &&
          request &&
          this.shouldAttachCsrfToken(request) &&
          !request._csrfRetry
        ) {
          const token = await this.bootstrapCsrfToken(true);
          if (token) {
            request._csrfRetry = true;
            this.setCsrfHeader(request, token);
            return this.ensureAxiosInstance().request(request);
          }
        }

        if (typeof window !== 'undefined' && error?.response?.status === 401) {
          const isLoginRoute = window.location.pathname.startsWith('/login');
          if (!isLoginRoute) {
            const from = `${window.location.pathname}${window.location.search}`;
            window.location.assign(`/login?from=${encodeURIComponent(from)}`);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  private getRequestPath(url?: string): string {
    if (!url) {
      return '';
    }
    const [withoutQuery] = url.split('?');
    if (!withoutQuery.startsWith('http://') && !withoutQuery.startsWith('https://')) {
      return withoutQuery;
    }
    try {
      return new URL(withoutQuery).pathname;
    } catch {
      return withoutQuery;
    }
  }

  private isMutatingMethod(method?: string): boolean {
    const normalized = method?.toUpperCase() || 'GET';
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalized);
  }

  private isCsrfExemptPath(path: string): boolean {
    return path.startsWith('/admin/auth/') || path === '/csrf-token';
  }

  private shouldAttachCsrfToken(config: { method?: string; url?: string }): boolean {
    if (!this.isMutatingMethod(config.method)) {
      return false;
    }
    const path = this.getRequestPath(config.url);
    return !this.isCsrfExemptPath(path);
  }

  private setCsrfHeader(config: CsrfAwareRequestConfig, token: string): void {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('X-CSRF-Token', token);
    config.headers = headers;
  }

  private async bootstrapCsrfToken(forceRefresh: boolean = false): Promise<string | null> {
    if (!forceRefresh && this.csrfToken) {
      return this.csrfToken;
    }
    if (!forceRefresh && this.csrfBootstrapPromise) {
      return this.csrfBootstrapPromise;
    }

    const axiosInstance = this.ensureAxiosInstance();
    this.csrfBootstrapPromise = axiosInstance
      .get<{ csrfToken?: string }>('/csrf-token', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      .then((response) => {
        const token = response.data?.csrfToken;
        this.csrfToken = typeof token === 'string' && token.length > 0 ? token : null;
        return this.csrfToken;
      })
      .catch((error: AxiosError) => {
        this.csrfToken = null;
        if (error?.response?.status !== 401 && error?.response?.status !== 404) {
          console.error('Failed to bootstrap CSRF token:', error);
        }
        return null;
      })
      .finally(() => {
        this.csrfBootstrapPromise = null;
      });

    return this.csrfBootstrapPromise;
  }

  private throwFeatureUnavailable(feature: string, endpoint: string): never {
    throw new Error(
      `Admin API capability "${feature}" is not available in this environment (missing backend route: ${endpoint}).`,
    );
  }

  async login(
    email: string,
    password: string,
  ): Promise<{
    access_token?: string;
    role?: 'admin';
    adminRole?: AdminRole;
    mfaRequired?: boolean;
    mfaEnrollmentRequired?: boolean;
    challengeMethod?: 'totp' | 'totp_or_recovery';
    challengeToken?: string;
    mfaVerified?: boolean;
    mfaEnrolled?: boolean;
    bootstrapToken?: string;
    otpauthUrl?: string;
    manualEntryKey?: string;
    qrCodeDataUrl?: string;
    recoveryCodes?: string[];
    recoveryCodesRemaining?: number;
    mfaMethod?: 'otp' | 'recovery';
  }> {
    const res = await this.axiosInstance.post(
      '/admin/auth/login',
      { email, password },
    );
    return res.data;
  }

  async verifyMfa(payload: {
    challengeToken: string;
    otpCode?: string;
    recoveryCode?: string;
  }): Promise<{
    access_token: string;
    role: 'admin';
    adminRole?: AdminRole;
    mfaVerified: true;
    mfaMethod: 'otp' | 'recovery';
    recoveryCodesRemaining?: number;
  }> {
    const res = await this.axiosInstance.post(
      '/admin/auth/verify-mfa',
      payload,
    );
    return res.data;
  }

  async startMfaBootstrap(email: string, password: string): Promise<{
    mfaEnrollmentRequired: true;
    bootstrapToken: string;
    otpauthUrl: string;
    manualEntryKey: string;
    qrCodeDataUrl: string;
    recoveryCodesCount: number;
  }> {
    const res = await this.axiosInstance.post(
      '/admin/auth/mfa/bootstrap/start',
      { email, password },
    );
    return res.data;
  }

  async completeMfaBootstrap(
    bootstrapToken: string,
    otpCode: string,
  ): Promise<{
    access_token: string;
    role: 'admin';
    adminRole?: AdminRole;
    mfaVerified: true;
    mfaEnrolled: true;
    recoveryCodes: string[];
    recoveryCodesRemaining: number;
  }> {
    const res = await this.axiosInstance.post(
      '/admin/auth/mfa/bootstrap/complete',
      { bootstrapToken, otpCode },
    );
    return res.data;
  }

  async getMfaStatus(): Promise<{
    mfaRequired: boolean;
    enrolled: boolean;
    source: 'credential' | 'legacy-env' | null;
    recoveryCodesRemaining: number;
    lastVerifiedAt: string | null;
    recoveryCodesGeneratedAt: string | null;
  }> {
    const res = await this.ensureAxiosInstance().get('/admin/auth/mfa/status');
    return res.data;
  }

  async getAdminSession(): Promise<AdminSession> {
    const res = await this.ensureAxiosInstance().get('/admin/auth/me');
    return res.data;
  }

  async regenerateRecoveryCodes(payload: {
    otpCode?: string;
    recoveryCode?: string;
  }): Promise<{
    recoveryCodes: string[];
    recoveryCodesRemaining: number;
  }> {
    const res = await this.ensureAxiosInstance().post(
      '/admin/auth/mfa/recovery-codes/regenerate',
      payload,
    );
    return res.data;
  }

  async getAuthAuditLogs(params?: {
    limit?: number;
    offset?: number;
    eventType?: string;
    outcome?: 'success' | 'failure';
  }): Promise<AdminAuthAuditLogsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.eventType) searchParams.set('eventType', params.eventType);
    if (params?.outcome) searchParams.set('outcome', params.outcome);

    const query = searchParams.toString();
    const res = await this
      .ensureAxiosInstance()
      .get(`/admin/auth/audit-logs${query ? `?${query}` : ''}`);
    return res.data;
  }

  async logout() {
    const axiosInstance = this.ensureAxiosInstance();
    await axiosInstance.post('/admin/auth/logout', {});
  }


  private ensureAxiosInstance() {
    if (!this.axiosInstance) {
      this.initializeAxios();
    }
    return this.axiosInstance;
  }

  // --- Database Viewer Methods ---
  async getDatabaseTables(): Promise<string[]> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get('/admin/database/tables');
    return response.data;
  }

  async getDatabaseColumns(table: string): Promise<
    DatabaseColumn[]
  > {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/database/columns/${table}`);
    return response.data;
  }

  async getDatabaseRows(
    table: string,
    page: number = 1,
    limit: number = 20
  ): Promise<DatabaseRowsResponse> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/database/rows/${table}?page=${page}&limit=${limit}`);
    return response.data;
  }

  async runSqlQuery(sql: string): Promise<SqlQueryResponse> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.post(
      '/admin/database/run-sql?confirm=ADMIN_SQL_EXECUTE',
      { sql },
    );
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getUserAnalytics(timeRange: string): Promise<AnalyticsData> {
    try {
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get(`/admin/user-analytics/${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(timeRange: string): Promise<AnalyticsData> {
    try {
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get(`/admin/revenue-analytics/${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      throw error;
    }
  }

  async getTradeAnalytics(timeRange: string): Promise<TradeAnalyticsData> {
    void timeRange;
    return this.throwFeatureUnavailable('tradeAnalytics', '/admin/trades/analytics');
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get('/admin/system-health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }

  async getActivityFeed(limit: number): Promise<Activity[]> {
    try {
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get(`/admin/activity-feed?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
      throw error;
    }
  }

  async getSubscriptionAnalytics(timeRange: string): Promise<SubscriptionAnalytics> {
    try {
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get(`/admin/subscription/analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscription analytics:', error);
      throw error;
    }
  }

  async getGeographicData(): Promise<GeographicData[]> {
    return this.throwFeatureUnavailable('geographicAnalytics', '/admin/analytics/geographic');
  }

  async getUsers(page: number, limit: number, search?: string): Promise<UsersResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const axiosInstance = this.ensureAxiosInstance();
      const response = await axiosInstance.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async getUserDetail(userId: string): Promise<AdminUserDetailResponse> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/users/${userId}`);
    return response.data;
  }

  async getTrades(
    page: number,
    limit: number,
    status?: string,
    userId?: string,
  ): Promise<AdminTradesResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set('status', status);
    if (userId) params.set('userId', userId);

    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/trades?${params.toString()}`);
    return response.data;
  }

  async getAccounts(
    page: number,
    limit: number,
    userId?: string,
  ): Promise<AdminAccountsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (userId) params.set('userId', userId);

    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/accounts?${params.toString()}`);
    return response.data;
  }

  async getSubscriptions(
    page: number,
    limit: number,
    status?: string,
    plan?: string,
  ): Promise<AdminSubscriptionsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set('status', status);
    if (plan) params.set('plan', plan);

    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/subscriptions?${params.toString()}`);
    return response.data;
  }

  // --- New Enhanced Admin Methods ---

  async getLogs(
    limit: number = 100,
    offset: number = 0,
    level?: string,
    startDate?: string,
    endDate?: string
  ): Promise<LogsResponse> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (level) params.set('level', level);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(`/admin/logs?${params.toString()}`);
    return response.data;
  }

  async getLogsStream(): Promise<{ message: string; latestLogs: LogEntry[] }> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get('/admin/logs/stream');
    return response.data;
  }

  async testEndpoint(testData: AdminTestEndpointRequest): Promise<AdminTestEndpointResponse> {
    void testData;
    return this.throwFeatureUnavailable('apiTestEndpoint', '/admin/test-endpoint');
  }

  async getSystemDiagnostics(): Promise<SystemDiagnostics> {
    return this.throwFeatureUnavailable('systemDiagnostics', '/admin/system-diagnostics');
  }

  async clearCache(keys?: string[]): Promise<{ success: boolean; message: string; clearedKeys: string[]; timestamp: string }> {
    void keys;
    return this.throwFeatureUnavailable('clearCache', '/admin/clear-cache');
  }

  async getPerformanceMetrics(timeRange: string = '1h'): Promise<PerformanceMetrics> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(
      `/admin/analytics/performance?timeRange=${encodeURIComponent(timeRange)}`,
    );
    return response.data;
  }

  async getErrorAnalytics(timeRange: string = '24h'): Promise<ErrorAnalytics> {
    void timeRange;
    return this.throwFeatureUnavailable('errorAnalytics', '/admin/error-analytics');
  }

  async createDebugSession(sessionData: { description: string; userId?: string }): Promise<AdminDebugSession> {
    void sessionData;
    return this.throwFeatureUnavailable('debugSessionCreate', '/admin/debug-session');
  }

  async getDebugSessions(): Promise<{ data: AdminDebugSession[]; total: number }> {
    return this.throwFeatureUnavailable('debugSessions', '/admin/debug-sessions');
  }

  async getApiUsageStats(timeRange: string = '24h'): Promise<ApiUsageStats> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get(
      `/admin/api/usage?timeRange=${encodeURIComponent(timeRange)}`,
    );
    return response.data;
  }

  async backupDatabase(): Promise<{ success: boolean; message: string; backupId: string; estimatedDuration: string; timestamp: string }> {
    return this.throwFeatureUnavailable('backupDatabase', '/admin/backup-database');
  }

  async getBackupStatus(): Promise<AdminBackupStatus> {
    return this.throwFeatureUnavailable('backupStatus', '/admin/backup-status');
  }

  // --- Test User Methods ---
  async createTestUser(): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    stats: {
      trades: number;
      accounts: number;
      strategies: number;
      tags: number;
    };
  }> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.post('/admin/test-user/create');
    return response.data;
  }

  async deleteTestUser(): Promise<{ message: string }> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.delete('/admin/test-user/delete');
    return response.data;
  }

  // --- Database Management Methods ---
  async getTableStats(): Promise<{
    tables: Array<{
      tableName: string;
      rowCount: number;
      size: string;
      sizeBytes: number;
      canClear: boolean;
      error?: string;
    }>;
    totalTables: number;
    timestamp: string;
  }> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.get('/admin/database/table-stats');
    return response.data;
  }

  async clearTable(tableName: string, confirm: string): Promise<{
    message: string;
    deletedCount: number;
  }> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.delete(`/admin/database/clear-table/${tableName}?confirm=${confirm}`);
    return response.data;
  }

  async clearAllTables(confirm: string, doubleConfirm: string): Promise<{
    message: string;
    tablesCleared: string[];
    totalDeleted: number;
  }> {
    const axiosInstance = this.ensureAxiosInstance();
    const response = await axiosInstance.delete(`/admin/database/clear-all-tables?confirm=${confirm}&doubleConfirm=${doubleConfirm}`);
    return response.data;
  }
}

export const adminApi = new AdminApi();

export default adminApi;
