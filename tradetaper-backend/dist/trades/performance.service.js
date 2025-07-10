"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PerformanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trade_entity_1 = require("./entities/trade.entity");
const enums_1 = require("../types/enums");
let PerformanceService = PerformanceService_1 = class PerformanceService {
    tradesRepository;
    logger = new common_1.Logger(PerformanceService_1.name);
    constructor(tradesRepository) {
        this.tradesRepository = tradesRepository;
    }
    async getPerformanceMetrics(userContext, accountId, dateFrom, dateTo) {
        this.logger.log(`Calculating performance metrics for user ${userContext.id}`);
        const queryBuilder = this.tradesRepository
            .createQueryBuilder('trade')
            .where('trade.userId = :userId', { userId: userContext.id })
            .andWhere('trade.status = :status', { status: enums_1.TradeStatus.CLOSED });
        if (accountId) {
            queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
        }
        if (dateFrom) {
            queryBuilder.andWhere('trade.openTime >= :dateFrom', { dateFrom });
        }
        if (dateTo) {
            queryBuilder.andWhere('trade.openTime <= :dateTo', { dateTo });
        }
        const trades = await queryBuilder.getMany();
        return this.calculateMetrics(trades);
    }
    async getDailyPerformance(userContext, accountId, days = 30) {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - days);
        const queryBuilder = this.tradesRepository
            .createQueryBuilder('trade')
            .where('trade.userId = :userId', { userId: userContext.id })
            .andWhere('trade.status = :status', { status: enums_1.TradeStatus.CLOSED })
            .andWhere('trade.closeTime >= :dateFrom', {
            dateFrom: dateFrom.toISOString(),
        });
        if (accountId) {
            queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
        }
        const trades = await queryBuilder.getMany();
        return this.groupTradesByDay(trades);
    }
    async getMonthlyPerformance(userContext, accountId, months = 12) {
        const dateFrom = new Date();
        dateFrom.setMonth(dateFrom.getMonth() - months);
        const queryBuilder = this.tradesRepository
            .createQueryBuilder('trade')
            .where('trade.userId = :userId', { userId: userContext.id })
            .andWhere('trade.status = :status', { status: enums_1.TradeStatus.CLOSED })
            .andWhere('trade.closeTime >= :dateFrom', {
            dateFrom: dateFrom.toISOString(),
        });
        if (accountId) {
            queryBuilder.andWhere('trade.accountId = :accountId', { accountId });
        }
        const trades = await queryBuilder.getMany();
        return this.groupTradesByMonth(trades);
    }
    calculateMetrics(trades) {
        const totalTrades = trades.length;
        const winningTrades = trades.filter((t) => (t.profitOrLoss || 0) > 0);
        const losingTrades = trades.filter((t) => (t.profitOrLoss || 0) < 0);
        const totalPnL = trades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const totalCommissions = trades.reduce((sum, t) => sum + (t.commission || 0), 0);
        const netPnL = totalPnL - totalCommissions;
        const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
        const averageWin = winningTrades.length > 0
            ? winningTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
                winningTrades.length
            : 0;
        const averageLoss = losingTrades.length > 0
            ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
                losingTrades.length)
            : 0;
        const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;
        const largestWin = winningTrades.length > 0
            ? Math.max(...winningTrades.map((t) => t.profitOrLoss || 0))
            : 0;
        const largestLoss = losingTrades.length > 0
            ? Math.min(...losingTrades.map((t) => t.profitOrLoss || 0))
            : 0;
        const averageRMultiple = trades.length > 0
            ? trades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / trades.length
            : 0;
        const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;
        const returns = trades.map((t) => t.profitOrLoss || 0);
        const avgReturn = returns.length > 0
            ? returns.reduce((a, b) => a + b, 0) / returns.length
            : 0;
        const variance = returns.length > 0
            ? returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
                returns.length
            : 0;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
        const maxDrawdown = this.calculateMaxDrawdown(trades);
        const { consecutiveWins, consecutiveLosses } = this.calculateConsecutiveStreaks(trades);
        const tradingDays = this.calculateTradingDays(trades);
        const averageTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;
        return {
            totalTrades,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate,
            totalPnL,
            totalCommissions,
            netPnL,
            averageWin,
            averageLoss,
            profitFactor,
            largestWin,
            largestLoss,
            averageRMultiple,
            expectancy,
            sharpeRatio,
            maxDrawdown,
            consecutiveWins,
            consecutiveLosses,
            tradingDays,
            averageTradesPerDay,
        };
    }
    calculateMaxDrawdown(trades) {
        const sortedTrades = trades
            .filter((t) => t.closeTime)
            .sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
        let peak = 0;
        let maxDrawdown = 0;
        let runningPnL = 0;
        for (const trade of sortedTrades) {
            runningPnL += trade.profitOrLoss || 0;
            if (runningPnL > peak) {
                peak = runningPnL;
            }
            const drawdown = peak - runningPnL;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        return maxDrawdown;
    }
    calculateConsecutiveStreaks(trades) {
        const sortedTrades = trades
            .filter((t) => t.closeTime)
            .sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
        let maxWins = 0;
        let maxLosses = 0;
        let currentWins = 0;
        let currentLosses = 0;
        for (const trade of sortedTrades) {
            const pnl = trade.profitOrLoss || 0;
            if (pnl > 0) {
                currentWins++;
                currentLosses = 0;
                maxWins = Math.max(maxWins, currentWins);
            }
            else if (pnl < 0) {
                currentLosses++;
                currentWins = 0;
                maxLosses = Math.max(maxLosses, currentLosses);
            }
        }
        return { consecutiveWins: maxWins, consecutiveLosses: maxLosses };
    }
    calculateTradingDays(trades) {
        const uniqueDays = new Set(trades
            .filter((t) => t.closeTime)
            .map((t) => new Date(t.closeTime).toDateString()));
        return uniqueDays.size;
    }
    groupTradesByDay(trades) {
        const dailyGroups = {};
        trades.forEach((trade) => {
            if (trade.closeTime) {
                const dateKey = new Date(trade.closeTime).toISOString().split('T')[0];
                if (!dailyGroups[dateKey]) {
                    dailyGroups[dateKey] = [];
                }
                dailyGroups[dateKey].push(trade);
            }
        });
        let cumulativePnL = 0;
        return Object.entries(dailyGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dayTrades]) => {
            const dayPnL = dayTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
            const wins = dayTrades.filter((t) => (t.profitOrLoss || 0) > 0).length;
            const winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
            cumulativePnL += dayPnL;
            return {
                date,
                trades: dayTrades.length,
                pnl: dayPnL,
                winRate,
                cumulativePnL,
            };
        });
    }
    groupTradesByMonth(trades) {
        const monthlyGroups = {};
        trades.forEach((trade) => {
            if (trade.closeTime) {
                const date = new Date(trade.closeTime);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyGroups[monthKey]) {
                    monthlyGroups[monthKey] = [];
                }
                monthlyGroups[monthKey].push(trade);
            }
        });
        return Object.entries(monthlyGroups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, monthTrades]) => {
            const monthPnL = monthTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
            const wins = monthTrades.filter((t) => (t.profitOrLoss || 0) > 0).length;
            const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
            const dailyPerformance = this.groupTradesByDay(monthTrades);
            const bestDay = dailyPerformance.length > 0
                ? Math.max(...dailyPerformance.map((d) => d.pnl))
                : 0;
            const worstDay = dailyPerformance.length > 0
                ? Math.min(...dailyPerformance.map((d) => d.pnl))
                : 0;
            return {
                month,
                trades: monthTrades.length,
                pnl: monthPnL,
                winRate,
                bestDay,
                worstDay,
            };
        });
    }
};
exports.PerformanceService = PerformanceService;
exports.PerformanceService = PerformanceService = PerformanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PerformanceService);
//# sourceMappingURL=performance.service.js.map