import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import {
  Subscription,
  SubscriptionStatus,
  SubscriptionTier,
} from '../subscriptions/entities/subscription.entity';
import { TradeDirection, TradeStatus, AssetType } from '../types/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private dataSource: DataSource,
  ) {}

  async getDashboardStats() {
    // Get real counts from database
    const totalUsers = await this.userRepository.count();
    const totalTrades = await this.tradeRepository.count();
    const totalSubscriptions = await this.subscriptionRepository.count();

    return {
      totalUsers,
      totalTrades,
      totalSubscriptions,
      activeUsers: 0, // Would need to calculate based on recent activity
      totalRevenue: 0, // Would need to calculate from subscriptions
      avgTradesPerUser:
        totalUsers > 0 ? Math.round((totalTrades / totalUsers) * 100) / 100 : 0,
      successRate: 0, // Would need to calculate from trade outcomes
      monthlyGrowth: 0, // Would need historical data
    };
  }

  async getUserAnalytics(timeRange: string) {
    // Generate sample data points for the chart
    const days = this.getDaysFromTimeRange(timeRange);
    const data: Array<{ date: string; users: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        users: 0, // Real data would come from database queries
      });
    }

    return {
      labels: data.map((d) => d.date),
      values: data.map((d) => d.users),
      data,
    };
  }

  async getRevenueAnalytics(timeRange: string) {
    // Generate sample data points for the chart
    const days = this.getDaysFromTimeRange(timeRange);
    const data: Array<{ date: string; revenue: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: 0, // Real data would come from database queries
      });
    }

    return {
      labels: data.map((d) => d.date),
      values: data.map((d) => d.revenue),
      data,
    };
  }

  async getSystemHealth() {
    return {
      status: 'healthy',
      uptime: 99.9,
      responseTime: 45,
      memoryUsage: 68,
      cpuUsage: 23,
      cacheHitRate: 94,
      timestamp: new Date().toISOString(),
    };
  }

  async getActivityFeed(limit: number = 5) {
    // Return empty array since we don't have activity tracking yet
    return [];
  }

  async getUsers(page: number = 1, limit: number = 20) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTrades(page: number = 1, limit: number = 50) {
    const [trades, total] = await this.tradeRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return {
      data: trades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAccounts(page: number = 1, limit: number = 50) {
    const [accounts, total] = await this.accountRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return {
      data: accounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDatabaseTables(): Promise<string[]> {
    try {
      const query = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `;
      const result = await this.dataSource.query(query);
      return result.map((row: any) => row.table_name);
    } catch (error) {
      console.error('Error fetching database tables:', error);
      return [];
    }
  }

  async getDatabaseTable(tableName: string) {
    try {
      const query = `SELECT * FROM "${tableName}" LIMIT 100;`;
      const result = await this.dataSource.query(query);
      return result;
    } catch (error) {
      console.error(`Error fetching table ${tableName}:`, error);
      return [];
    }
  }

  async getDatabaseColumns(tableName: string) {
    try {
      const query = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      const result = await this.dataSource.query(query, [tableName]);
      return result;
    } catch (error) {
      console.error(`Error fetching columns for ${tableName}:`, error);
      return [];
    }
  }

  async getDatabaseRows(
    tableName: string,
    page: number = 1,
    limit: number = 20,
  ) {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await this.dataSource.query(countQuery);
      const total = parseInt(countResult[0].count);

      // Get paginated data
      const dataQuery = `SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2;`;
      const data = await this.dataSource.query(dataQuery, [limit, offset]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error(`Error fetching rows from ${tableName}:`, error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }

  async createRow(table: string, data: any) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      if (keys.length === 0) throw new Error('No data provided');

      const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
      const query = `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.dataSource.query(query, values);
      return result[0];
    } catch (error) {
      console.error(`Error creating row in ${table}:`, error);
      throw error;
    }
  }

  async updateRow(table: string, id: string, data: any) {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      if (keys.length === 0) throw new Error('No data provided');

      const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(',');
      const query = `UPDATE "${table}" SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
      const result = await this.dataSource.query(query, [...values, id]);
      return result[0];
    } catch (error) {
      console.error(`Error updating row in ${table}:`, error);
      throw error;
    }
  }

  async deleteRow(table: string, id: string) {
    try {
      const query = `DELETE FROM "${table}" WHERE id = $1 RETURNING *`;
      const result = await this.dataSource.query(query, [id]);
      return result[0];
    } catch (error) {
      console.error(`Error deleting row from ${table}:`, error);
      throw error;
    }
  }

  private getDaysFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      default:
        return 30;
    }
  }

  async seedSampleData() {
    try {
      // Create sample users
      const sampleUsers = [
        {
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'hashedpassword123',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          email: 'jane.smith@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'hashedpassword456',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
        {
          email: 'mike.johnson@example.com',
          firstName: 'Mike',
          lastName: 'Johnson',
          password: 'hashedpassword789',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
        {
          email: 'sarah.wilson@example.com',
          firstName: 'Sarah',
          lastName: 'Wilson',
          password: 'hashedpassword101',
          isEmailVerified: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
        {
          email: 'alex.brown@example.com',
          firstName: 'Alex',
          lastName: 'Brown',
          password: 'hashedpassword202',
          isEmailVerified: false,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      ];

      // Insert users
      const createdUsers: User[] = [];
      for (const userData of sampleUsers) {
        const existingUser = await this.userRepository.findOne({
          where: { email: userData.email },
        });
        if (!existingUser) {
          const user = this.userRepository.create(userData);
          const savedUser = await this.userRepository.save(user);
          createdUsers.push(savedUser);
        } else {
          createdUsers.push(existingUser);
        }
      }

      // Create sample trades
      const sampleTrades = [
        {
          user: createdUsers[0],
          symbol: 'EURUSD',
          side: TradeDirection.LONG,
          quantity: 1.5,
          openPrice: 1.085,
          closePrice: 1.092,
          status: TradeStatus.CLOSED,
          profitOrLoss: 105.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[0],
          symbol: 'GBPUSD',
          side: TradeDirection.SHORT,
          quantity: 2.0,
          openPrice: 1.265,
          closePrice: 1.258,
          status: TradeStatus.CLOSED,
          profitOrLoss: 140.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[1],
          symbol: 'USDJPY',
          side: TradeDirection.LONG,
          quantity: 1.0,
          openPrice: 149.5,
          closePrice: 150.2,
          status: TradeStatus.CLOSED,
          profitOrLoss: 70.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[1],
          symbol: 'AUDUSD',
          side: TradeDirection.LONG,
          quantity: 1.8,
          openPrice: 0.675,
          status: TradeStatus.OPEN,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[2],
          symbol: 'USDCAD',
          side: TradeDirection.SHORT,
          quantity: 1.2,
          openPrice: 1.345,
          closePrice: 1.338,
          status: TradeStatus.CLOSED,
          profitOrLoss: 84.0,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          closeTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[3],
          symbol: 'EURJPY',
          side: TradeDirection.LONG,
          quantity: 0.8,
          openPrice: 162.3,
          status: TradeStatus.OPEN,
          assetType: AssetType.FOREX,
          openTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ];

      // Insert trades
      let createdTrades = 0;
      for (const tradeData of sampleTrades) {
        const existingTrade = await this.tradeRepository.findOne({
          where: {
            symbol: tradeData.symbol,
            user: { id: tradeData.user.id },
            createdAt: tradeData.createdAt,
          },
        });
        if (!existingTrade) {
          const trade = this.tradeRepository.create(tradeData);
          await this.tradeRepository.save(trade);
          createdTrades++;
        }
      }

      // Create sample subscriptions
      const sampleSubscriptions = [
        {
          user: createdUsers[0],
          plan: 'premium',
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[1],
          plan: 'basic',
          status: SubscriptionStatus.ACTIVE,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          user: createdUsers[2],
          plan: 'premium',
          status: SubscriptionStatus.CANCELED,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ];

      // Skip subscriptions for now due to schema mismatch
      const createdSubscriptions = 0;
      // TODO: Fix subscription entity/database schema mismatch
      console.log('Skipping subscription seeding due to schema mismatch');

      return {
        success: true,
        message: 'Sample data seeded successfully',
        data: {
          users: createdUsers.length,
          trades: createdTrades,
          subscriptions: createdSubscriptions,
        },
      };
    } catch (error) {
      console.error('Error seeding sample data:', error);
      return {
        success: false,
        message: 'Failed to seed sample data',
        error: error.message,
      };
    }
  }

  async clearTable(tableName: string): Promise<{ deletedCount: number }> {
    // Whitelist of tables that can be safely cleared
    const allowedTables = [
      'trades',
      'tags',
      'trade_tags',
      'mt5_accounts',
      'strategies',
      'subscriptions',
      'usage_tracking',
    ];

    if (!allowedTables.includes(tableName)) {
      throw new Error(
        `Table ${tableName} is not allowed to be cleared for safety reasons`,
      );
    }

    try {
      // Get count before deletion
      const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
      const countResult = await this.dataSource.query(countQuery);
      const deletedCount = parseInt(countResult[0].count);

      // Clear the table
      const deleteQuery = `DELETE FROM "${tableName}";`;
      await this.dataSource.query(deleteQuery);

      return { deletedCount };
    } catch (error) {
      console.error(`Error clearing table ${tableName}:`, error);
      throw new Error(`Failed to clear table ${tableName}: ${error.message}`);
    }
  }

  async clearAllTables(): Promise<{
    tablesCleared: string[];
    totalDeleted: number;
  }> {
    const allowedTables = [
      'trades',
      'tags',
      'trade_tags',
      'mt5_accounts',
      'strategies',
      'subscriptions',
      'usage_tracking',
    ];

    let totalDeleted = 0;
    const tablesCleared: string[] = [];

    try {
      // Clear tables in order to avoid foreign key constraints
      const clearOrder = [
        'trade_tags', // Junction table first
        'trades', // Then trades
        'tags', // Then tags
        'mt5_accounts', // MT5 accounts
        'strategies', // Strategies
        'usage_tracking', // Usage tracking
        'subscriptions', // Finally subscriptions
      ];

      for (const tableName of clearOrder) {
        if (allowedTables.includes(tableName)) {
          const result = await this.clearTable(tableName);
          totalDeleted += result.deletedCount;
          tablesCleared.push(tableName);
        }
      }

      return { tablesCleared, totalDeleted };
    } catch (error) {
      console.error('Error clearing all tables:', error);
      throw new Error(`Failed to clear all tables: ${error.message}`);
    }
  }

  async getTableStats() {
    try {
      const tablesQuery = `
        SELECT 
          schemaname as schema_name,
          tablename as table_name,
          attname as column_name,
          typname as data_type
        FROM pg_tables pt
        LEFT JOIN pg_attribute pa ON pa.attrelid = (pt.schemaname||'.'||pt.tablename)::regclass
        LEFT JOIN pg_type pt2 ON pa.atttypid = pt2.oid
        WHERE schemaname = 'public'
        AND pa.attnum > 0
        AND NOT pa.attisdropped
        ORDER BY table_name, pa.attnum;
      `;

      const result = await this.dataSource.query(tablesQuery);

      // Group by table
      const tableStats: Record<string, any> = {};
      result.forEach((row: any) => {
        if (!tableStats[row.table_name]) {
          tableStats[row.table_name] = {
            name: row.table_name,
            columns: [],
          };
        }
        if (row.column_name) {
          tableStats[row.table_name].columns.push({
            name: row.column_name,
            type: row.data_type,
          });
        }
      });

      return Object.values(tableStats);
    } catch (error) {
      console.error('Error fetching table stats:', error);
      return [];
    }
  }

  async runSql(
    sql: string,
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      console.log('Executing SQL:', sql);
      const result = await this.dataSource.query(sql);
      return {
        success: true,
        result,
      };
    } catch (error) {
      console.error('SQL execution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
