import axios from 'axios';

// API Base URL - update this to your actual backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://tradetaper-backend-production.up.railway.app/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  // TODO: Get token from localStorage or cookies
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
});

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
  totalUsers: number;
  activeUsers: number;
  totalTrades: number;
  totalRevenue: number;
  userGrowth: number;
  tradeGrowth: number;
  activeGrowth: number;
  revenueGrowth: number;
  dailyStats?: {
    date: string;
    users: number;
    trades: number;
    revenue: number;
    signups: number;
  }[];
  topTradingPairs?: {
    pair: string;
    count: number;
    volume: number;
  }[];
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

// API Functions
export const adminApi = {
  // Dashboard Analytics
  getDashboardStats: async (): Promise<AnalyticsData> => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },

  getUserAnalytics: async (timeRange: string = '30d'): Promise<{ dailyStats: DailyStats[] }> => {
    const response = await api.get(`/admin/user-analytics?timeRange=${timeRange}`);
    return response.data;
  },

  getRevenueAnalytics: async (timeRange: string = '30d'): Promise<{ dailyStats: DailyStats[] }> => {
    const response = await api.get(`/admin/revenue-analytics?timeRange=${timeRange}`);
    return response.data;
  },

  getTradeAnalytics: async (timeRange: string = '30d'): Promise<{ topTradingPairs: TradingPair[] }> => {
    const response = await api.get(`/admin/trade-analytics?timeRange=${timeRange}`);
    return response.data;
  },

  // Geographic Data
  getGeographicData: async (): Promise<GeographicData[]> => {
    const response = await api.get('/admin/geographic-data');
    return response.data;
  },

  // Activity Feed
  getActivityFeed: async (limit: number = 50, type?: string): Promise<ActivityEvent[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);
    
    const response = await api.get(`/admin/activity-feed?${params.toString()}`);
    return response.data;
  },

  // System Health
  getSystemHealth: async (): Promise<SystemHealth> => {
    const response = await api.get('/admin/system-health');
    return response.data;
  },

  // User Management
  getUsers: async (page: number = 1, limit: number = 20, search?: string): Promise<UsersResponse> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (search) params.append('search', search);
    
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },

  // Top Trading Pairs
  getTopTradingPairs: async (timeRange: string = '30d'): Promise<{ topTradingPairs: TradingPair[] }> => {
    const response = await api.get(`/admin/top-trading-pairs?timeRange=${timeRange}`);
    return response.data;
  },

  // Subscription Analytics
  getSubscriptionAnalytics: async (timeRange: string = '30d'): Promise<{ subscriptionDistribution: SubscriptionData[] }> => {
    const response = await api.get(`/admin/subscription-analytics?timeRange=${timeRange}`);
    return response.data;
  },
};

export default api; 