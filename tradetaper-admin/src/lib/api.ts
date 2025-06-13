import axios from 'axios';

// API Base URL - configured via environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No authentication interceptors - open access

// Authentication functions removed - open access admin panel

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

export interface AnalyticsData {
  labels: string[];
  values: number[];
  data: Array<{
    date: string;
    users?: number;
    revenue?: number;
    trades?: number;
  }>;
}

export interface TradeAnalyticsData extends AnalyticsData {
  topTradingPairs: TradingPair[];
}

export interface SubscriptionAnalytics {
  subscriptionDistribution: Array<{
    plan: string;
    count: number;
    revenue: number;
    color?: string;
    price?: number;
  }>;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  databaseConnections: number;
  errors24h: number;
  apiCalls24h: number;
  cacheHitRate: number;
}

export interface GeographicData {
  country: string;
  users: number;
  trades: number;
  revenue: number;
  coordinates: [number, number];
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

export interface DashboardStats {
  totalUsers: number;
  userGrowth: number;
  activeUsers: number;
  activeGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
  totalTrades: number;
  tradeGrowth: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
  };
}

export interface LogEntry {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: string;
  details?: Record<string, any>;
  timestamp: string;
  userId?: string;
  endpoint?: string;
  method?: string;
}

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

export interface PerformanceMetrics {
  data: Array<{
    timestamp: string;
    responseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Array<{ type: string; count: number }>;
  errorsByEndpoint: Array<{ endpoint: string; count: number }>;
  timeRange: string;
}

export interface ApiUsageStats {
  totalRequests: number;
  requestsByEndpoint: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
  requestsByMethod: Array<{ method: string; count: number; percentage: number }>;
  timeRange: string;
}

class AdminApi {
  private baseUrl: string;
  private axiosInstance;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // No authentication interceptors - open access admin panel
  }

  // --- Database Viewer Methods ---
  async getDatabaseTables(): Promise<string[]> {
    const response = await this.axiosInstance.get('/admin/database/tables');
    return response.data;
  }

  async getDatabaseColumns(table: string): Promise<
    Array<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null }>
  > {
    const response = await this.axiosInstance.get('/admin/database/columns', { params: { table } });
    return response.data;
  }

  async getDatabaseRows(
    table: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: Record<string, unknown>[]; total: number; page: number; limit: number; totalPages: number }> {
    const response = await this.axiosInstance.get('/admin/database/rows', {
      params: { table, page, limit },
    });
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.axiosInstance.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  async getUserAnalytics(timeRange: string): Promise<AnalyticsData> {
    try {
      const response = await this.axiosInstance.get(`/admin/user-analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user analytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(timeRange: string): Promise<AnalyticsData> {
    try {
      const response = await this.axiosInstance.get(`/admin/revenue-analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      throw error;
    }
  }

  async getTradeAnalytics(timeRange: string): Promise<TradeAnalyticsData> {
    try {
      const response = await this.axiosInstance.get(`/admin/trade-analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trade analytics:', error);
      throw error;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await this.axiosInstance.get('/admin/system-health');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      throw error;
    }
  }

  async getActivityFeed(limit: number): Promise<Activity[]> {
    try {
      const response = await this.axiosInstance.get(`/admin/activity-feed?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch activity feed:', error);
      throw error;
    }
  }

  async getSubscriptionAnalytics(timeRange: string): Promise<SubscriptionAnalytics> {
    try {
      const response = await this.axiosInstance.get(`/admin/subscription-analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch subscription analytics:', error);
      throw error;
    }
  }

  async getGeographicData(): Promise<GeographicData[]> {
    try {
      const response = await this.axiosInstance.get('/admin/geographic-data');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch geographic data:', error);
      throw error;
    }
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
      
      const response = await this.axiosInstance.get(`/admin/users?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  // --- New Enhanced Admin Methods ---

  async getLogs(
    limit: number = 100,
    offset: number = 0,
    level?: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ data: LogEntry[]; total: number; limit: number; offset: number }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });
      
      if (level) params.append('level', level);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await this.axiosInstance.get(`/admin/logs?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      throw error;
    }
  }

  async getLogsStream(): Promise<{ message: string; latestLogs: LogEntry[] }> {
    try {
      const response = await this.axiosInstance.get('/admin/logs/stream');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch logs stream:', error);
      throw error;
    }
  }

  async testEndpoint(testData: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    queryParams?: Record<string, string>;
  }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/admin/test-endpoint', testData);
      return response.data;
    } catch (error) {
      console.error('Failed to test endpoint:', error);
      throw error;
    }
  }

  async getSystemDiagnostics(): Promise<SystemDiagnostics> {
    try {
      const response = await this.axiosInstance.get('/admin/system-diagnostics');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system diagnostics:', error);
      throw error;
    }
  }

  async clearCache(keys?: string[]): Promise<{ success: boolean; message: string; clearedKeys: string[]; timestamp: string }> {
    try {
      const response = await this.axiosInstance.post('/admin/clear-cache', { keys });
      return response.data;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(timeRange: string = '1h'): Promise<PerformanceMetrics> {
    try {
      const response = await this.axiosInstance.get(`/admin/performance-metrics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  async getErrorAnalytics(timeRange: string = '24h'): Promise<ErrorAnalytics> {
    try {
      const response = await this.axiosInstance.get(`/admin/error-analytics?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch error analytics:', error);
      throw error;
    }
  }

  async createDebugSession(sessionData: { description: string; userId?: string }): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/admin/debug-session', sessionData);
      return response.data;
    } catch (error) {
      console.error('Failed to create debug session:', error);
      throw error;
    }
  }

  async getDebugSessions(): Promise<{ data: any[]; total: number }> {
    try {
      const response = await this.axiosInstance.get('/admin/debug-sessions');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch debug sessions:', error);
      throw error;
    }
  }

  async getApiUsageStats(timeRange: string = '24h'): Promise<ApiUsageStats> {
    try {
      const response = await this.axiosInstance.get(`/admin/api-usage-stats?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch API usage stats:', error);
      throw error;
    }
  }

  async backupDatabase(): Promise<{ success: boolean; message: string; backupId: string; estimatedDuration: string; timestamp: string }> {
    try {
      const response = await this.axiosInstance.post('/admin/backup-database');
      return response.data;
    } catch (error) {
      console.error('Failed to backup database:', error);
      throw error;
    }
  }

  async getBackupStatus(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/admin/backup-status');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch backup status:', error);
      throw error;
    }
  }
}

export const adminApi = new AdminApi();

export default api;
