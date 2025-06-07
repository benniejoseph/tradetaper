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

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Handle specific error cases
          switch (error.response.status) {
            case 401:
              // Handle unauthorized
              window.location.href = '/login';
              break;
            case 403:
              // Handle forbidden
              console.error('Access forbidden');
              break;
            case 429:
              // Handle rate limiting
              console.error('Too many requests');
              break;
            default:
              console.error('API Error:', error.response.data);
          }
        }
        return Promise.reject(error);
      }
    );
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
      // TODO: Uncomment when backend endpoint is ready
      // const response = await this.axiosInstance.get(`/api/admin/analytics/trades?timeRange=${timeRange}`);
      // return response.data;
      
      // For now, return mock data since the backend endpoint might not exist yet
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = timeRange; // Acknowledge the parameter until backend is ready
      const mockData: TradeAnalyticsData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [120, 190, 300, 500, 200, 300, 450],
        data: [
          { date: '2024-01-01', trades: 120 },
          { date: '2024-01-02', trades: 190 },
          { date: '2024-01-03', trades: 300 },
          { date: '2024-01-04', trades: 500 },
          { date: '2024-01-05', trades: 200 },
          { date: '2024-01-06', trades: 300 },
          { date: '2024-01-07', trades: 450 },
        ],
        topTradingPairs: [
          { pair: 'EUR/USD', count: 1250, volume: 2500000 },
          { pair: 'GBP/USD', count: 980, volume: 1950000 },
          { pair: 'USD/JPY', count: 750, volume: 1500000 },
          { pair: 'AUD/USD', count: 620, volume: 1240000 },
          { pair: 'EUR/GBP', count: 450, volume: 900000 },
          { pair: 'USD/CAD', count: 380, volume: 760000 },
        ]
      };
      return mockData;
    } catch (error) {
      console.error('Failed to fetch trade analytics:', error);
      // Return mock data as fallback
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [120, 190, 300, 500, 200, 300, 450],
        data: [
          { date: '2024-01-01', trades: 120 },
          { date: '2024-01-02', trades: 190 },
          { date: '2024-01-03', trades: 300 },
          { date: '2024-01-04', trades: 500 },
          { date: '2024-01-05', trades: 200 },
          { date: '2024-01-06', trades: 300 },
          { date: '2024-01-07', trades: 450 },
        ],
        topTradingPairs: [
          { pair: 'EUR/USD', count: 1250, volume: 2500000 },
          { pair: 'GBP/USD', count: 980, volume: 1950000 },
          { pair: 'USD/JPY', count: 750, volume: 1500000 },
          { pair: 'AUD/USD', count: 620, volume: 1240000 },
          { pair: 'EUR/GBP', count: 450, volume: 900000 },
          { pair: 'USD/CAD', count: 380, volume: 760000 },
        ]
      };
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
      // Return mock data as fallback
      return {
        data: [
          {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            createdAt: '2024-01-02T00:00:00Z',
            updatedAt: '2024-01-02T00:00:00Z',
          },
        ],
        total: 2,
        page,
        limit,
        totalPages: 1,
      };
    }
  }
}

export const adminApi = new AdminApi();

export default api; 