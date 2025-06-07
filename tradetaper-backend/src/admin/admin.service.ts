import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Trade)
    private tradesRepository: Repository<Trade>,
  ) {}

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
    const userGrowth = previousUsers > 0 
      ? ((currentMonthUsers - previousUsers) / previousUsers) * 100 
      : 0;
    
    const tradeGrowth = previousTrades > 0 
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
          .select('SUM(trade.quantity * trade.entryPrice)', 'volume')
          .where('trade.symbol = :symbol', { symbol: pair.pair })
          .where('trade.createdAt >= :startDate', { startDate })
          .getRawOne();

        return {
          pair: pair.pair,
          count: parseInt(pair.count),
          volume: parseFloat(volume?.volume || 0),
        };
      })
    );

    return { 
      data,
      topTradingPairs: topTradingPairsWithVolume 
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
      { country: 'United States', users: 5432, trades: 12456, revenue: 78900, coordinates: [-95.7129, 37.0902] },
      { country: 'United Kingdom', users: 3456, trades: 8765, revenue: 56700, coordinates: [-3.4360, 55.3781] },
      { country: 'Germany', users: 2345, trades: 6789, revenue: 45600, coordinates: [10.4515, 51.1657] },
      { country: 'Canada', users: 1876, trades: 4567, revenue: 34500, coordinates: [-106.3468, 56.1304] },
      { country: 'Australia', users: 1543, trades: 3456, revenue: 23400, coordinates: [133.7751, -25.2744] },
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
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
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
        { search: `%${search}%` }
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
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }
} 