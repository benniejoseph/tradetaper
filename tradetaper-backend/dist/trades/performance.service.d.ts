import { Repository } from 'typeorm';
import { Trade } from './entities/trade.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
export interface PerformanceMetrics {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    totalCommissions: number;
    netPnL: number;
    totalTradedValue: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    largestWin: number;
    largestLoss: number;
    averageRMultiple: number;
    expectancy: number;
    sharpeRatio: number;
    maxDrawdown: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    tradingDays: number;
    averageTradesPerDay: number;
}
export interface DailyPerformance {
    date: string;
    trades: number;
    pnl: number;
    winRate: number;
    cumulativePnL: number;
}
export interface MonthlyPerformance {
    month: string;
    trades: number;
    pnl: number;
    winRate: number;
    bestDay: number;
    worstDay: number;
}
export declare class PerformanceService {
    private readonly tradesRepository;
    private readonly logger;
    constructor(tradesRepository: Repository<Trade>);
    getPerformanceMetrics(userContext: UserResponseDto, accountId?: string, dateFrom?: string, dateTo?: string, filters?: {
        status?: string;
        direction?: string;
        assetType?: string;
        symbol?: string;
        search?: string;
        isStarred?: boolean;
        minPnl?: number;
        maxPnl?: number;
        minDuration?: number;
        maxDuration?: number;
    }): Promise<PerformanceMetrics>;
    getDailyPerformance(userContext: UserResponseDto, accountId?: string, days?: number): Promise<DailyPerformance[]>;
    getMonthlyPerformance(userContext: UserResponseDto, accountId?: string, months?: number): Promise<MonthlyPerformance[]>;
    private calculateMetrics;
    private calculateMaxDrawdown;
    private calculateConsecutiveStreaks;
    private calculateTradingDays;
    private groupTradesByDay;
    private groupTradesByMonth;
}
