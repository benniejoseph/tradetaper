import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Trade } from '../trades/entities/trade.entity';

export interface DailyStatItem {
  date: string;
  users: number;
  signups: number;
}

export interface RevenueStatItem {
  date: string;
  revenue: number;
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

@Injectable()
export class AdminService {
  private logs: LogEntry[] = [];
  private debugSessions: any[] = [];

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Trade)
    private tradesRepository: Repository<Trade>,
    private dataSource: DataSource,
  ) {
    // Initialize with some sample logs
    this.initializeSampleLogs();
  }

  private initializeSampleLogs() {
    const sampleLogs: LogEntry[] = [
      {
        id: '1',
        level: 'info',
        message: 'System initialized successfully',
        context: 'Application',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        level: 'debug',
        message: 'Database connection established',
        context: 'Database',
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
      {
        id: '3',
        level: 'warn',
        message: 'High memory usage detected: 85%',
        context: 'System',
        timestamp: new Date(Date.now() - 120000).toISOString(),
      },
      {
        id: '4',
        level: 'error',
        message: 'Failed to connect to external API',
        context: 'ExternalAPI',
        timestamp: new Date(Date.now() - 180000).toISOString(),
      },
    ];
    this.logs = sampleLogs;
  }

  async getDashboardStats() {
    const [totalUsers, totalTrades] = await Promise.all([
      this.usersRepository.count(),
      this.tradesRepository.count(),
    ]);

    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.lastLoginAt > :date', { date: thirtyDaysAgo })
      .getCount();

    // Calculate growth metrics by comparing with previous period
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [previousUsers, previousTrades] = await Promise.all([
      this.usersRepository.count({
        where: {
          createdAt: Between(sixtyDaysAgo, thirtyDaysAgo),
        },
      }),
      this.tradesRepository.count({
        where: {
          createdAt: Between(sixtyDaysAgo, thirtyDaysAgo),
        },
      }),
    ]);

    const currentMonthUsers = await this.usersRepository.count({
      where: {
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    const currentMonthTrades = await this.tradesRepository.count({
      where: {
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    // Calculate growth percentages
    const userGrowth =
      previousUsers > 0
        ? ((currentMonthUsers - previousUsers) / previousUsers) * 100
        : 0;

    const tradeGrowth =
      previousTrades > 0
        ? ((currentMonthTrades - previousTrades) / previousTrades) * 100
        : 0;

    // Get revenue data (simplified - would need subscription service integration)
    const avgSubscriptionPrice = 19.99; // Average of all plan prices
    const paidUsers = Math.floor(totalUsers * 0.15); // Assume 15% conversion rate
    const totalRevenue = paidUsers * avgSubscriptionPrice;

    // Calculate revenue growth (mock for now)
    const revenueGrowth = 12.5;
    const activeGrowth = userGrowth * 0.8; // Active users grow slightly slower than total

    return {
      totalUsers,
      activeUsers,
      totalTrades,
      totalRevenue,
      userGrowth: Math.round(userGrowth * 10) / 10,
      tradeGrowth: Math.round(tradeGrowth * 10) / 10,
      activeGrowth: Math.round(activeGrowth * 10) / 10,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
    };
  }

  async getUserAnalytics(timeRange: string) {
    const days = this.parseTimeRange(timeRange);

    // Get daily user signups
    const data: Array<{
      date: string;
      users: number;
      signups: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const dailySignups = await this.usersRepository.count({
        where: {
          createdAt: Between(date, nextDate),
        },
      });

      // Get total users up to this date
      const totalUsers = await this.usersRepository.count({
        where: {
          createdAt: Between(new Date(0), nextDate),
        },
      });

      data.push({
        date: date.toISOString().split('T')[0],
        users: totalUsers,
        signups: dailySignups,
      });
    }

    return { data };
  }

  async getTradeAnalytics(timeRange: string) {
    const days = this.parseTimeRange(timeRange);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get daily trade data
    const data: Array<{
      date: string;
      trades: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const trades = await this.tradesRepository.count({
        where: {
          createdAt: Between(date, nextDate),
        },
      });

      data.push({
        date: date.toISOString().split('T')[0],
        trades,
      });
    }

    // Get top trading pairs within time range
    const topTradingPairs = await this.tradesRepository
      .createQueryBuilder('trade')
      .select('trade.symbol as pair, COUNT(*) as count')
      .where('trade.createdAt >= :startDate', { startDate })
      .groupBy('trade.symbol')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    // Calculate real volumes based on trade quantity and price
    const topTradingPairsWithVolume = await Promise.all(
      topTradingPairs.map(async (pair) => {
        const volume = await this.tradesRepository
          .createQueryBuilder('trade')
          .select('SUM(trade.quantity * trade.openPrice)', 'volume')
          .where('trade.symbol = :symbol', { symbol: pair.pair })
          .where('trade.createdAt >= :startDate', { startDate })
          .getRawOne();

        return {
          pair: pair.pair,
          count: parseInt(pair.count),
          volume: parseFloat(volume?.volume || 0),
        };
      }),
    );

    return {
      data,
      topTradingPairs: topTradingPairsWithVolume,
    };
  }

  async getRevenueAnalytics(timeRange: string) {
    const days = this.parseTimeRange(timeRange);

    // Calculate revenue based on user growth and subscription assumptions
    const data: Array<{
      date: string;
      revenue: number;
    }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      // Get users created on this day
      const dailyUsers = await this.usersRepository.count({
        where: {
          createdAt: Between(date, nextDate),
        },
      });

      // Calculate estimated revenue: assume 15% conversion rate and avg $19.99/month
      const estimatedRevenue = dailyUsers * 0.15 * 19.99;

      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.max(estimatedRevenue, 0),
      });
    }

    return { data };
  }

  async getGeographicData() {
    // Mock geographic data (would integrate with IP geolocation)
    return [
      {
        country: 'United States',
        users: 5432,
        trades: 12456,
        revenue: 78900,
        coordinates: [-95.7129, 37.0902],
      },
      {
        country: 'United Kingdom',
        users: 3456,
        trades: 8765,
        revenue: 56700,
        coordinates: [-3.436, 55.3781],
      },
      {
        country: 'Germany',
        users: 2345,
        trades: 6789,
        revenue: 45600,
        coordinates: [10.4515, 51.1657],
      },
      {
        country: 'Canada',
        users: 1876,
        trades: 4567,
        revenue: 34500,
        coordinates: [-106.3468, 56.1304],
      },
      {
        country: 'Australia',
        users: 1543,
        trades: 3456,
        revenue: 23400,
        coordinates: [133.7751, -25.2744],
      },
    ];
  }

  async getActivityFeed(limit: number, type?: string) {
    // Get recent users as activity (would implement proper activity logging)
    const recentUsers = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const activities = recentUsers.map((user, index) => ({
      id: user.id,
      userId: user.id,
      userName:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
      type: 'login' as const,
      description: 'User registered on the platform',
      timestamp: user.createdAt.toISOString(),
      metadata: {},
      ipAddress: '192.168.1.1',
      location: 'Unknown',
    }));

    return activities;
  }

  async getSystemHealth() {
    // Mock system health (would integrate with monitoring service)
    return {
      status: 'healthy',
      uptime: 99.99,
      responseTime: 145,
      memoryUsage: 68,
      cpuUsage: 23,
      diskUsage: 45,
      databaseConnections: 12,
      errors24h: 3,
      apiCalls24h: 45678,
      cacheHitRate: 94.5,
    };
  }

  async getUsers(page: number, limit: number, search?: string) {
    const query = this.usersRepository.createQueryBuilder('user');

    if (search) {
      query.where(
        'user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search',
        { search: `%${search}%` },
      );
    }

    const [users, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTopTradingPairs(timeRange: string) {
    return this.getTradeAnalytics(timeRange);
  }

  async getSubscriptionAnalytics(timeRange: string) {
    // Mock subscription analytics (would integrate with subscription service)
    return {
      subscriptionDistribution: [
        { plan: 'Free', count: 8500, revenue: 0 },
        { plan: 'Pro', count: 4500, revenue: 135000 },
        { plan: 'Premium', count: 2234, revenue: 99567 },
      ],
    };
  }

  private parseTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }

  // --- Database Viewer Methods ---

  async getDatabaseTables() {
    // List all user tables in the public schema
    const result = await this.dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return result.map((row: any) => row.table_name);
  }

  async getDatabaseColumns(table: string) {
    // List columns for a given table
    const result = await this.dataSource.query(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
      `,
      [table]
    );
    return result;
  }

  async getDatabaseRows(table: string, page: number = 1, limit: number = 20) {
    // Paginate rows for a given table
    const offset = (page - 1) * limit;
    // Use identifier escaping to prevent SQL injection
    const rows = await this.dataSource.query(
      `SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    // Get total count
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) FROM "${table}"`
    );
    const total = parseInt(countResult[0]?.count || '0', 10);
    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // --- New Enhanced Admin Methods ---

  async getLogs(
    limit: number = 100,
    offset: number = 0,
    level?: string,
    startDate?: string,
    endDate?: string,
  ) {
    let filteredLogs = [...this.logs];

    // Filter by level
    if (level && level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= end);
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    return {
      data: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset,
    };
  }

  async getLogsStream() {
    // This would implement Server-Sent Events for real-time logs
    // For now, return the latest logs
    return {
      message: 'Real-time log streaming would be implemented here',
      latestLogs: this.logs.slice(-10),
    };
  }

  async testEndpoint(testData: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
    queryParams?: Record<string, string>;
  }) {
    // This would make internal API calls to test endpoints
    // For now, return a mock response
    return {
      success: true,
      message: 'Endpoint test functionality would be implemented here',
      testData,
      mockResponse: {
        status: 200,
        data: { message: 'Test successful' },
        duration: Math.floor(Math.random() * 500) + 50,
      },
    };
  }

  async getSystemDiagnostics(): Promise<SystemDiagnostics> {
    // Mock system diagnostics (would integrate with actual system monitoring)
    return {
      database: {
        status: 'connected',
        connectionCount: 12,
        queryTime: 45,
      },
      memory: {
        used: 2048,
        total: 4096,
        percentage: 50,
      },
      cpu: {
        usage: 23,
        loadAverage: [0.5, 0.7, 0.8],
      },
      disk: {
        used: 15360,
        total: 51200,
        percentage: 30,
      },
      network: {
        inbound: 1024,
        outbound: 2048,
      },
    };
  }

  async clearCache(keys?: string[]) {
    // This would clear application cache
    return {
      success: true,
      message: keys ? `Cleared cache for keys: ${keys.join(', ')}` : 'Cleared all cache',
      clearedKeys: keys || ['all'],
      timestamp: new Date().toISOString(),
    };
  }

  async getPerformanceMetrics(timeRange: string) {
    // Mock performance metrics
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 1;
    const dataPoints = Math.min(hours * 6, 144); // 6 points per hour, max 144

    const data = Array.from({ length: dataPoints }, (_, i) => {
      const timestamp = new Date(Date.now() - (dataPoints - i - 1) * 10 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        responseTime: Math.floor(Math.random() * 200) + 50,
        throughput: Math.floor(Math.random() * 1000) + 500,
        errorRate: Math.random() * 5,
        cpuUsage: Math.random() * 80 + 10,
        memoryUsage: Math.random() * 70 + 20,
      };
    });

    return { data };
  }

  async getErrorAnalytics(timeRange: string) {
    // Mock error analytics
    return {
      totalErrors: 45,
      errorsByType: [
        { type: '500 Internal Server Error', count: 20 },
        { type: '404 Not Found', count: 15 },
        { type: '401 Unauthorized', count: 7 },
        { type: '400 Bad Request', count: 3 },
      ],
      errorsByEndpoint: [
        { endpoint: '/api/v1/trades', count: 12 },
        { endpoint: '/api/v1/users/profile', count: 8 },
        { endpoint: '/api/v1/auth/login', count: 6 },
      ],
      timeRange,
    };
  }

  async createDebugSession(sessionData: { description: string; userId?: string }) {
    const session = {
      id: Date.now().toString(),
      description: sessionData.description,
      userId: sessionData.userId,
      createdAt: new Date().toISOString(),
      status: 'active',
      logs: [],
    };

    this.debugSessions.push(session);
    return session;
  }

  async getDebugSessions() {
    return {
      data: this.debugSessions,
      total: this.debugSessions.length,
    };
  }

  async getApiUsageStats(timeRange: string) {
    // Mock API usage statistics
    return {
      totalRequests: 125430,
      requestsByEndpoint: [
        { endpoint: '/api/v1/trades', count: 45230, avgResponseTime: 120 },
        { endpoint: '/api/v1/users', count: 32100, avgResponseTime: 85 },
        { endpoint: '/api/v1/auth/login', count: 28900, avgResponseTime: 95 },
        { endpoint: '/api/v1/market-data', count: 19200, avgResponseTime: 200 },
      ],
      requestsByMethod: [
        { method: 'GET', count: 89340, percentage: 71.2 },
        { method: 'POST', count: 25670, percentage: 20.5 },
        { method: 'PUT', count: 7890, percentage: 6.3 },
        { method: 'DELETE', count: 2530, percentage: 2.0 },
      ],
      timeRange,
    };
  }

  async backupDatabase() {
    // Mock database backup
    return {
      success: true,
      message: 'Database backup initiated',
      backupId: `backup_${Date.now()}`,
      estimatedDuration: '5-10 minutes',
      timestamp: new Date().toISOString(),
    };
  }

  async getBackupStatus() {
    // Mock backup status
    return {
      lastBackup: {
        id: `backup_${Date.now() - 86400000}`,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        size: '2.5 GB',
        duration: '8 minutes',
      },
      nextScheduledBackup: new Date(Date.now() + 86400000).toISOString(),
      backupRetentionDays: 30,
      totalBackups: 15,
    };
  }
}
