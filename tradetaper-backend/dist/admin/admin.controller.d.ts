import { AdminService } from './admin.service';
import { TestUserSeedService } from '../seed/test-user-seed.service';
export declare class AdminController {
    private readonly adminService;
    private readonly testUserSeedService;
    constructor(adminService: AdminService, testUserSeedService: TestUserSeedService);
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
    getActivityFeed(limit?: string): Promise<never[]>;
    getUsers(page?: string, limit?: string): Promise<{
        data: import("../users/entities/user.entity").User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getTrades(page?: string, limit?: string): Promise<{
        data: import("../trades/entities/trade.entity").Trade[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAccounts(page?: string, limit?: string): Promise<{
        data: import("../users/entities/account.entity").Account[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getDatabaseTables(): Promise<string[]>;
    getDatabaseTable(table: string): Promise<any>;
    getDatabaseColumns(table: string): Promise<any>;
    getDatabaseRows(table: string, page?: string, limit?: string): Promise<{
        data: any;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
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
    createTestUser(): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            firstName: string | undefined;
            lastName: string | undefined;
        };
        stats: {
            trades: number;
            accounts: number;
            strategies: number;
            tags: number;
        };
    }>;
    deleteTestUser(): Promise<{
        message: string;
    }>;
    clearTable(tableName: string, confirm: string): Promise<{
        error: string;
        message: string;
        deletedCount?: undefined;
    } | {
        message: string;
        deletedCount: number;
        error?: undefined;
    }>;
    clearAllTables(confirm: string, doubleConfirm: string): Promise<{
        error: string;
        message: string;
        tablesCleared?: undefined;
        totalDeleted?: undefined;
    } | {
        message: string;
        tablesCleared: string[];
        totalDeleted: number;
        error?: undefined;
    }>;
    getTableStats(): Promise<any[]>;
    runSql(confirm: string, body: {
        sql: string;
    }): Promise<{
        success: boolean;
        result?: any;
        error?: string;
    } | {
        error: string;
        message: string;
    }>;
}
