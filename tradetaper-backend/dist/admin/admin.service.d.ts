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
    getUserAnalytics(timeRange: string): Promise<{
        labels: string[];
        values: number[];
        data: {
            date: string;
            users: number;
        }[];
    }>;
    getRevenueAnalytics(timeRange: string): Promise<{
        labels: string[];
        values: number[];
        data: {
            date: string;
            revenue: number;
        }[];
    }>;
    getSystemHealth(): Promise<{
        status: string;
        uptime: number;
        responseTime: number;
        memoryUsage: number;
        cpuUsage: number;
        cacheHitRate: number;
        timestamp: string;
    }>;
    getActivityFeed(limit?: number): Promise<never[]>;
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
    createRow(table: string, data: any): Promise<any>;
    updateRow(table: string, id: string, data: any): Promise<any>;
    deleteRow(table: string, id: string): Promise<any>;
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
    getTableStats(): Promise<any[]>;
    runSql(sql: string): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    }>;
}
