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
var AdvancedAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const trade_entity_1 = require("./entities/trade.entity");
let AdvancedAnalyticsService = AdvancedAnalyticsService_1 = class AdvancedAnalyticsService {
    tradesRepository;
    logger = new common_1.Logger(AdvancedAnalyticsService_1.name);
    constructor(tradesRepository) {
        this.tradesRepository = tradesRepository;
    }
    async calculateAdvancedMetrics(userId, fromDate, toDate) {
        this.logger.log(`Calculating advanced metrics for user ${userId}`);
        const trades = await this.getTradesForAnalysis(userId, fromDate, toDate);
        if (trades.length === 0) {
            return this.getEmptyMetrics();
        }
        const dailyReturns = this.calculateDailyReturns(trades);
        const monthlyReturns = this.calculateMonthlyReturns(trades);
        const drawdowns = this.calculateDrawdowns(trades);
        return {
            sharpeRatio: this.calculateSharpeRatio(dailyReturns),
            sortinoRatio: this.calculateSortinoRatio(dailyReturns),
            calmarRatio: this.calculateCalmarRatio(dailyReturns, drawdowns),
            maxDrawdown: this.calculateMaxDrawdown(drawdowns),
            maxDrawdownDuration: this.calculateMaxDrawdownDuration(drawdowns),
            valueAtRisk: this.calculateVaR(dailyReturns, 0.05),
            conditionalVaR: this.calculateCVaR(dailyReturns, 0.05),
            annualizedReturn: this.calculateAnnualizedReturn(dailyReturns),
            volatility: this.calculateVolatility(dailyReturns),
            beta: this.calculateBeta(dailyReturns),
            alpha: this.calculateAlpha(dailyReturns),
            informationRatio: this.calculateInformationRatio(dailyReturns),
            treynorRatio: this.calculateTreynorRatio(dailyReturns),
            winLossRatio: this.calculateWinLossRatio(trades),
            profitFactor: this.calculateProfitFactor(trades),
            expectancy: this.calculateExpectancy(trades),
            averageWin: this.calculateAverageWin(trades),
            averageLoss: this.calculateAverageLoss(trades),
            largestWin: this.calculateLargestWin(trades),
            largestLoss: this.calculateLargestLoss(trades),
            consecutiveWins: this.calculateConsecutiveWins(trades),
            consecutiveLosses: this.calculateConsecutiveLosses(trades),
            tradesPerDay: this.calculateTradesPerDay(trades),
            averageHoldingPeriod: this.calculateAverageHoldingPeriod(trades),
            dayOfWeekAnalysis: this.analyzeDayOfWeek(trades),
            monthlyPerformance: this.analyzeMonthlyPerformance(trades),
            correlationMatrix: this.calculateCorrelationMatrix(trades),
            seasonalAnalysis: this.analyzeSeasonality(trades),
            drawdownAnalysis: this.analyzeDrawdowns(drawdowns),
            tradingPatterns: this.identifyTradingPatterns(trades),
        };
    }
    async getTradesForAnalysis(userId, fromDate, toDate) {
        const whereClause = { userId };
        if (fromDate && toDate) {
            whereClause.openTime = (0, typeorm_2.Between)(fromDate, toDate);
        }
        return this.tradesRepository.find({
            where: whereClause,
            order: { openTime: 'ASC' },
        });
    }
    calculateDailyReturns(trades) {
        const dailyPnL = new Map();
        trades.forEach((trade) => {
            if (trade.closeTime &&
                trade.profitOrLoss !== null &&
                trade.profitOrLoss !== undefined) {
                const date = trade.closeTime.toISOString().split('T')[0];
                const currentPnL = dailyPnL.get(date) || 0;
                dailyPnL.set(date, currentPnL + trade.profitOrLoss);
            }
        });
        return Array.from(dailyPnL.values());
    }
    calculateMonthlyReturns(trades) {
        const monthlyPnL = new Map();
        trades.forEach((trade) => {
            if (trade.closeTime &&
                trade.profitOrLoss !== null &&
                trade.profitOrLoss !== undefined) {
                const month = trade.closeTime.toISOString().substring(0, 7);
                const currentPnL = monthlyPnL.get(month) || 0;
                monthlyPnL.set(month, currentPnL + trade.profitOrLoss);
            }
        });
        return Array.from(monthlyPnL.values());
    }
    calculateDrawdowns(trades) {
        const cumulativePnL = [];
        let runningTotal = 0;
        trades.forEach((trade) => {
            if (trade.profitOrLoss !== null) {
                runningTotal += trade.profitOrLoss;
                cumulativePnL.push(runningTotal);
            }
        });
        const drawdowns = [];
        let peak = cumulativePnL[0] || 0;
        cumulativePnL.forEach((value) => {
            if (value > peak) {
                peak = value;
            }
            const drawdown = ((value - peak) / Math.abs(peak)) * 100;
            drawdowns.push(drawdown);
        });
        return drawdowns;
    }
    calculateSharpeRatio(returns) {
        if (returns.length < 2)
            return 0;
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
            (returns.length - 1);
        const stdDev = Math.sqrt(variance);
        const riskFreeRate = 0.02 / 252;
        return stdDev === 0 ? 0 : ((mean - riskFreeRate) / stdDev) * Math.sqrt(252);
    }
    calculateSortinoRatio(returns) {
        if (returns.length < 2)
            return 0;
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const downside = returns.filter((r) => r < 0);
        if (downside.length === 0)
            return 0;
        const downsideVariance = downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length;
        const downsideDeviation = Math.sqrt(downsideVariance);
        const riskFreeRate = 0.02 / 252;
        return downsideDeviation === 0
            ? 0
            : ((mean - riskFreeRate) / downsideDeviation) * Math.sqrt(252);
    }
    calculateCalmarRatio(returns, drawdowns) {
        const annualizedReturn = this.calculateAnnualizedReturn(returns);
        const maxDrawdown = Math.abs(Math.min(...drawdowns, 0));
        return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
    }
    calculateMaxDrawdown(drawdowns) {
        return Math.abs(Math.min(...drawdowns, 0));
    }
    calculateMaxDrawdownDuration(drawdowns) {
        let maxDuration = 0;
        let currentDuration = 0;
        drawdowns.forEach((dd) => {
            if (dd < 0) {
                currentDuration++;
                maxDuration = Math.max(maxDuration, currentDuration);
            }
            else {
                currentDuration = 0;
            }
        });
        return maxDuration;
    }
    calculateVaR(returns, confidence) {
        const sorted = [...returns].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * confidence);
        return sorted[index] || 0;
    }
    calculateCVaR(returns, confidence) {
        const sorted = [...returns].sort((a, b) => a - b);
        const index = Math.floor(sorted.length * confidence);
        const tailReturns = sorted.slice(0, index);
        return tailReturns.length > 0
            ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length
            : 0;
    }
    calculateAnnualizedReturn(returns) {
        if (returns.length === 0)
            return 0;
        const totalReturn = returns.reduce((sum, r) => sum + r, 0);
        const periods = returns.length;
        const periodsPerYear = 252;
        return (totalReturn / periods) * periodsPerYear;
    }
    calculateVolatility(returns) {
        if (returns.length < 2)
            return 0;
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
            (returns.length - 1);
        return Math.sqrt(variance * 252);
    }
    calculateBeta(returns) {
        return 1;
    }
    calculateAlpha(returns) {
        const annualizedReturn = this.calculateAnnualizedReturn(returns);
        const riskFreeRate = 0.02;
        const marketReturn = 0.1;
        const beta = this.calculateBeta(returns);
        return (annualizedReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate)));
    }
    calculateInformationRatio(returns) {
        const excessReturns = returns.map((r) => r - 0.02 / 252);
        const mean = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
        if (excessReturns.length < 2)
            return 0;
        const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
            (excessReturns.length - 1);
        const trackingError = Math.sqrt(variance);
        return trackingError === 0 ? 0 : (mean / trackingError) * Math.sqrt(252);
    }
    calculateTreynorRatio(returns) {
        const annualizedReturn = this.calculateAnnualizedReturn(returns);
        const riskFreeRate = 0.02;
        const beta = this.calculateBeta(returns);
        return beta === 0 ? 0 : (annualizedReturn - riskFreeRate) / beta;
    }
    calculateWinLossRatio(trades) {
        const winningTrades = trades.filter((t) => t.profitOrLoss && t.profitOrLoss > 0).length;
        const losingTrades = trades.filter((t) => t.profitOrLoss && t.profitOrLoss < 0).length;
        return losingTrades === 0 ? winningTrades : winningTrades / losingTrades;
    }
    calculateProfitFactor(trades) {
        const grossProfit = trades
            .filter((t) => t.profitOrLoss && t.profitOrLoss > 0)
            .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const grossLoss = Math.abs(trades
            .filter((t) => t.profitOrLoss && t.profitOrLoss < 0)
            .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0));
        return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    }
    calculateExpectancy(trades) {
        const wins = trades.filter((t) => t.profitOrLoss && t.profitOrLoss > 0);
        const losses = trades.filter((t) => t.profitOrLoss && t.profitOrLoss < 0);
        const winRate = wins.length / trades.length;
        const lossRate = losses.length / trades.length;
        const avgWin = wins.length > 0
            ? wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / wins.length
            : 0;
        const avgLoss = losses.length > 0
            ? losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
                losses.length
            : 0;
        return winRate * avgWin + lossRate * avgLoss;
    }
    calculateAverageWin(trades) {
        const wins = trades.filter((t) => t.profitOrLoss && t.profitOrLoss > 0);
        return wins.length > 0
            ? wins.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / wins.length
            : 0;
    }
    calculateAverageLoss(trades) {
        const losses = trades.filter((t) => t.profitOrLoss && t.profitOrLoss < 0);
        return losses.length > 0
            ? losses.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
                losses.length
            : 0;
    }
    calculateLargestWin(trades) {
        const profits = trades
            .filter((t) => t.profitOrLoss && t.profitOrLoss > 0)
            .map((t) => t.profitOrLoss);
        return profits.length > 0 ? Math.max(...profits) : 0;
    }
    calculateLargestLoss(trades) {
        const losses = trades
            .filter((t) => t.profitOrLoss && t.profitOrLoss < 0)
            .map((t) => t.profitOrLoss);
        return losses.length > 0 ? Math.min(...losses) : 0;
    }
    calculateConsecutiveWins(trades) {
        let maxConsecutive = 0;
        let current = 0;
        trades.forEach((trade) => {
            if (trade.profitOrLoss && trade.profitOrLoss > 0) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            }
            else {
                current = 0;
            }
        });
        return maxConsecutive;
    }
    calculateConsecutiveLosses(trades) {
        let maxConsecutive = 0;
        let current = 0;
        trades.forEach((trade) => {
            if (trade.profitOrLoss && trade.profitOrLoss < 0) {
                current++;
                maxConsecutive = Math.max(maxConsecutive, current);
            }
            else {
                current = 0;
            }
        });
        return maxConsecutive;
    }
    calculateTradesPerDay(trades) {
        if (trades.length === 0)
            return 0;
        const firstTrade = trades[0].openTime;
        const lastTrade = trades[trades.length - 1].closeTime || trades[trades.length - 1].openTime;
        const daysDiff = Math.ceil((lastTrade.getTime() - firstTrade.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff === 0 ? trades.length : trades.length / daysDiff;
    }
    calculateAverageHoldingPeriod(trades) {
        const closedTrades = trades.filter((t) => t.closeTime);
        if (closedTrades.length === 0)
            return 0;
        const totalHours = closedTrades.reduce((sum, trade) => {
            const hours = (trade.closeTime.getTime() - trade.openTime.getTime()) /
                (1000 * 60 * 60);
            return sum + hours;
        }, 0);
        return totalHours / closedTrades.length;
    }
    analyzeDayOfWeek(trades) {
        const dayStats = new Map();
        const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ];
        trades.forEach((trade) => {
            const day = days[trade.openTime.getDay()];
            const current = dayStats.get(day) || { trades: 0, profit: 0 };
            dayStats.set(day, {
                trades: current.trades + 1,
                profit: current.profit + (trade.profitOrLoss || 0),
            });
        });
        return Object.fromEntries(dayStats);
    }
    analyzeMonthlyPerformance(trades) {
        const monthStats = new Map();
        trades.forEach((trade) => {
            const month = trade.openTime.toISOString().substring(0, 7);
            const current = monthStats.get(month) || { trades: 0, profit: 0 };
            monthStats.set(month, {
                trades: current.trades + 1,
                profit: current.profit + (trade.profitOrLoss || 0),
            });
        });
        return Object.fromEntries(monthStats);
    }
    calculateCorrelationMatrix(trades) {
        const symbolGroups = new Map();
        trades.forEach((trade) => {
            const symbol = trade.symbol;
            if (!symbolGroups.has(symbol)) {
                symbolGroups.set(symbol, []);
            }
            symbolGroups.get(symbol).push(trade);
        });
        const symbols = Array.from(symbolGroups.keys());
        const correlationMatrix = {};
        symbols.forEach((symbol1) => {
            correlationMatrix[symbol1] = {};
            symbols.forEach((symbol2) => {
                correlationMatrix[symbol1][symbol2] = this.calculateCorrelation(symbolGroups.get(symbol1), symbolGroups.get(symbol2));
            });
        });
        return correlationMatrix;
    }
    calculateCorrelation(trades1, trades2) {
        if (trades1.length < 2 || trades2.length < 2)
            return 0;
        const returns1 = trades1.map((t) => t.profitOrLoss || 0);
        const returns2 = trades2.map((t) => t.profitOrLoss || 0);
        const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
        const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
        let numerator = 0;
        let denominator1 = 0;
        let denominator2 = 0;
        const minLength = Math.min(returns1.length, returns2.length);
        for (let i = 0; i < minLength; i++) {
            const diff1 = returns1[i] - mean1;
            const diff2 = returns2[i] - mean2;
            numerator += diff1 * diff2;
            denominator1 += diff1 * diff1;
            denominator2 += diff2 * diff2;
        }
        const denominator = Math.sqrt(denominator1 * denominator2);
        return denominator === 0 ? 0 : numerator / denominator;
    }
    analyzeSeasonality(trades) {
        const monthlyStats = new Array(12)
            .fill(0)
            .map(() => ({ trades: 0, profit: 0 }));
        trades.forEach((trade) => {
            const month = trade.openTime.getMonth();
            monthlyStats[month].trades++;
            monthlyStats[month].profit += trade.profitOrLoss || 0;
        });
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        return monthlyStats.reduce((acc, stats, index) => {
            acc[months[index]] = stats;
            return acc;
        }, {});
    }
    analyzeDrawdowns(drawdowns) {
        const analysis = [];
        let inDrawdown = false;
        let start = 0;
        let maxDD = 0;
        drawdowns.forEach((dd, index) => {
            if (!inDrawdown && dd < 0) {
                inDrawdown = true;
                start = index;
                maxDD = dd;
            }
            else if (inDrawdown && dd < maxDD) {
                maxDD = dd;
            }
            else if (inDrawdown && dd >= 0) {
                analysis.push({
                    start,
                    end: index,
                    duration: index - start,
                    maxDrawdown: Math.abs(maxDD),
                });
                inDrawdown = false;
            }
        });
        return analysis;
    }
    identifyTradingPatterns(trades) {
        const patterns = [];
        const revengeTrading = this.detectRevengeTradingPattern(trades);
        if (revengeTrading.detected) {
            patterns.push({
                type: 'Revenge Trading',
                description: 'Increasing position size after losses',
                severity: 'High',
                occurrences: revengeTrading.count,
            });
        }
        const overtrading = this.detectOvertradingPattern(trades);
        if (overtrading.detected) {
            patterns.push({
                type: 'Overtrading',
                description: 'Excessive number of trades in short periods',
                severity: 'Medium',
                occurrences: overtrading.count,
            });
        }
        return patterns;
    }
    detectRevengeTradingPattern(trades) {
        let count = 0;
        for (let i = 1; i < trades.length; i++) {
            const prevTrade = trades[i - 1];
            const currentTrade = trades[i];
            if (prevTrade.profitOrLoss &&
                prevTrade.profitOrLoss < 0 &&
                currentTrade.quantity > prevTrade.quantity * 1.5) {
                count++;
            }
        }
        return { detected: count > 3, count };
    }
    detectOvertradingPattern(trades) {
        const dailyTradeCounts = new Map();
        trades.forEach((trade) => {
            const date = trade.openTime.toISOString().split('T')[0];
            dailyTradeCounts.set(date, (dailyTradeCounts.get(date) || 0) + 1);
        });
        const excessiveDays = Array.from(dailyTradeCounts.values()).filter((count) => count > 10).length;
        return { detected: excessiveDays > 5, count: excessiveDays };
    }
    getEmptyMetrics() {
        return {
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            maxDrawdown: 0,
            maxDrawdownDuration: 0,
            valueAtRisk: 0,
            conditionalVaR: 0,
            annualizedReturn: 0,
            volatility: 0,
            beta: 0,
            alpha: 0,
            informationRatio: 0,
            treynorRatio: 0,
            winLossRatio: 0,
            profitFactor: 0,
            expectancy: 0,
            averageWin: 0,
            averageLoss: 0,
            largestWin: 0,
            largestLoss: 0,
            consecutiveWins: 0,
            consecutiveLosses: 0,
            tradesPerDay: 0,
            averageHoldingPeriod: 0,
            dayOfWeekAnalysis: {},
            monthlyPerformance: {},
            correlationMatrix: {},
            seasonalAnalysis: {},
            drawdownAnalysis: [],
            tradingPatterns: [],
        };
    }
};
exports.AdvancedAnalyticsService = AdvancedAnalyticsService;
exports.AdvancedAnalyticsService = AdvancedAnalyticsService = AdvancedAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(trade_entity_1.Trade)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AdvancedAnalyticsService);
//# sourceMappingURL=advanced-analytics.service.js.map