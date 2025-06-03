import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tradetaper-backend-production.up.railway.app/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  country?: string;
  timezone?: string;
  createdAt: string;
  lastLoginAt?: string;
  subscriptionStatus: string;
  planType: string;
  isActive: boolean;
  totalTrades: number;
  lastIpAddress?: string;
  location?: {
    country: string;
    city: string;
    lat: number;
    lng: number;
  };
}

export interface Trade {
  id: string;
  userId: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  closedAt?: string;
  imageUrl?: string;
}

export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalTrades: number;
  totalRevenue: number;
  revenueGrowth: number;
  userGrowth: number;
  tradeGrowth: number;
  averageTradesPerUser: number;
  topTradingPairs: Array<{ pair: string; count: number; volume: number }>;
  subscriptionDistribution: Array<{ plan: string; count: number; revenue: number }>;
  dailyStats: Array<{
    date: string;
    users: number;
    trades: number;
    revenue: number;
    signups: number;
  }>;
  geographicData: Array<{
    country: string;
    users: number;
    trades: number;
    revenue: number;
    coordinates: [number, number];
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

// API functions
export const adminApi = {
  // Analytics
  getAnalytics: async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<Analytics> => {
    const response = await api.get(`/admin/analytics?timeRange=${timeRange}`);
    return response.data;
  },

  // Users
  getUsers: async (page: number = 1, limit: number = 50, search?: string): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${search || ''}`);
    return response.data;
  },

  getUserById: async (userId: string): Promise<User> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId: string, isActive: boolean): Promise<void> => {
    await api.patch(`/admin/users/${userId}/status`, { isActive });
  },

  // Trades
  getTrades: async (page: number = 1, limit: number = 50, filters?: {
    userId?: string;
    pair?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    trades: Trade[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await api.get(`/admin/trades?${params}`);
    return response.data;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  // Activity Feed
  getActivityFeed: async (limit: number = 100): Promise<ActivityEvent[]> => {
    const response = await api.get(`/admin/activity?limit=${limit}`);
    return response.data;
  },

  // Live Users (WebSocket endpoint)
  getLiveUsers: async (): Promise<Array<{
    userId: string;
    userName: string;
    location: { country: string; city: string; lat: number; lng: number };
    connectedAt: string;
    currentPage: string;
  }>> => {
    const response = await api.get('/admin/live-users');
    return response.data;
  },

  // Revenue analytics
  getRevenueAnalytics: async (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<{
    totalRevenue: number;
    recurringRevenue: number;
    oneTimePayments: number;
    churnRate: number;
    averageRevenuePerUser: number;
    revenueByPlan: Array<{ plan: string; amount: number; growth: number }>;
    monthlyRecurring: Array<{ month: string; amount: number }>;
  }> => {
    const response = await api.get(`/admin/revenue?timeRange=${timeRange}`);
    return response.data;
  },

  // Performance metrics
  getPerformanceMetrics: async (): Promise<{
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    peakResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number; calls: number }>;
    errorsByType: Array<{ type: string; count: number; percentage: number }>;
    hourlyMetrics: Array<{ hour: string; responseTime: number; errors: number; requests: number }>;
  }> => {
    const response = await api.get('/admin/performance');
    return response.data;
  },
};

// Set auth token for admin requests
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export default api; 