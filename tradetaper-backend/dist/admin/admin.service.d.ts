import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Account } from '../users/entities/account.entity';
import { Trade } from '../trades/entities/trade.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
export declare class AdminService {
    private userRepository;
    private accountRepository;
    private tradeRepository;
    private subscriptionRepository;
    private dataSource;
    private readonly logger;
    constructor(userRepository: Repository<User>, accountRepository: Repository<Account>, tradeRepository: Repository<Trade>, subscriptionRepository: Repository<Subscription>, dataSource: DataSource);
    getDashboardStats(): Promise<{
        totalUsers: number;
        totalTrades: number;
        totalSubscriptions: number;
        activeUsers: number;
        totalRevenue: number;
        avgTradesPerUser: number;
        successRate: number;
        monthlyGrowth: number;
    }>;
    getUserAnalytics(timeRange: string): {
        labels: string[];
        values: number[];
        data: {
            date: string;
            users: number;
        }[];
    };
    getRevenueAnalytics(timeRange: string): {
        labels: string[];
        values: number[];
        data: {
            date: string;
            revenue: number;
        }[];
    };
    getSystemHealth(): {
        status: string;
        uptime: number;
        responseTime: number;
        memoryUsage: number;
        cpuUsage: number;
        cacheHitRate: number;
        timestamp: string;
    };
    getActivityFeed(_limit?: number): never[];
    getUsers(page?: number, limit?: number): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getTrades(page?: number, limit?: number): Promise<{
        data: Trade[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAccounts(page?: number, limit?: number): Promise<{
        data: Account[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getDatabaseTables(): Promise<string[]>;
    getDatabaseTable(tableName: string): Promise<any>;
    getDatabaseColumns(tableName: string): Promise<any>;
    getDatabaseRows(tableName: string, page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    private getDaysFromTimeRange;
    seedSampleData(): Promise<{
        success: boolean;
        message: string;
        data: {
            users: number;
            trades: number;
            subscriptions: number;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    clearTable(tableName: string): Promise<{
        deletedCount: number;
    }>;
    clearAllTables(): Promise<{
        tablesCleared: string[];
        totalDeleted: number;
    }>;
    getTableStats(): Promise<{
        name: string;
        columns: Array<{
            name: string;
            type: string;
        }>;
    }[]>;
    runSql(sql: string): Promise<{
        success: boolean;
        result?: unknown;
        error?: string;
    }>;
}
