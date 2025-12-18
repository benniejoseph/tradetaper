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
            beta: 0,
            alpha: 0,
            informationRatio: 0,
            treynorRatio: 0,
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
        const excessReturn = mean - riskFreeRate;
        return stdDev === 0 ? 0 : excessReturn / stdDev;
    }
    calculateSortinoRatio(returns) {
        if (returns.length < 2)
            return 0;
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const downsideReturns = returns.filter((r) => r < 0);
        const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) /
            (returns.length - 1);
        const downsideDeviation = Math.sqrt(downsideVariance);
        const riskFreeRate = 0.02 / 252;
        const excessReturn = mean - riskFreeRate;
        return downsideDeviation === 0 ? 0 : excessReturn / downsideDeviation;
    }
    calculateCalmarRatio(returns, drawdowns) {
        const annualizedReturn = this.calculateAnnualizedReturn(returns);
        const maxDrawdown = Math.max(...drawdowns);
        return maxDrawdown === 0 ? 0 : annualizedReturn / maxDrawdown;
    }
    calculateMaxDrawdown(drawdowns) {
        return Math.max(...drawdowns);
    }
    calculateMaxDrawdownDuration(drawdowns) {
        let maxDuration = 0;
        let currentDuration = 0;
        drawdowns.forEach((d) => {
            if (d < 0) {
                currentDuration++;
            }
            else {
                if (currentDuration > maxDuration) {
                    maxDuration = currentDuration;
                }
                currentDuration = 0;
            }
        });
        return maxDuration;
    }
    calculateVaR(returns, confidence) {
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor(returns.length * confidence);
        return sortedReturns[index] || 0;
    }
    calculateCVaR(returns, confidence) {
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor(returns.length * confidence);
        const tail = sortedReturns.slice(0, index);
        return tail.length > 0
            ? tail.reduce((sum, r) => sum + r, 0) / tail.length
            : 0;
    }
    calculateAnnualizedReturn(returns) {
        if (returns.length === 0)
            return 0;
        const meanDailyReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        return Math.pow(1 + meanDailyReturn, 252) - 1;
    }
    calculateVolatility(returns) {
        if (returns.length < 2)
            return 0;
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
            (returns.length - 1);
        return Math.sqrt(variance) * Math.sqrt(252);
    }
    calculateWinLossRatio(trades) {
        const wins = trades.filter((t) => (t.profitOrLoss || 0) > 0).length;
        const losses = trades.filter((t) => (t.profitOrLoss || 0) < 0).length;
        return losses === 0 ? wins : wins / losses;
    }
    calculateProfitFactor(trades) {
        const grossProfit = trades
            .filter((t) => (t.profitOrLoss || 0) > 0)
            .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0);
        const grossLoss = Math.abs(trades
            .filter((t) => (t.profitOrLoss || 0) < 0)
            .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0));
        return grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    }
    calculateExpectancy(trades) {
        const winRate = trades.filter((t) => (t.profitOrLoss || 0) > 0).length / trades.length;
        const lossRate = trades.filter((t) => (t.profitOrLoss || 0) < 0).length / trades.length;
        const avgWin = this.calculateAverageWin(trades);
        const avgLoss = this.calculateAverageLoss(trades);
        if (lossRate === 0) {
            return avgWin;
        }
        if (winRate === 0) {
            return -avgLoss;
        }
        return winRate * avgWin - lossRate * avgLoss;
    }
    calculateAverageWin(trades) {
        const winningTrades = trades.filter((t) => (t.profitOrLoss || 0) > 0);
        return winningTrades.length > 0
            ? winningTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
                winningTrades.length
            : 0;
    }
    calculateAverageLoss(trades) {
        const losingTrades = trades.filter((t) => (t.profitOrLoss || 0) < 0);
        return losingTrades.length > 0
            ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) /
                losingTrades.length)
            : 0;
    }
    calculateLargestWin(trades) {
        return Math.max(0, ...trades.map((t) => t.profitOrLoss || 0));
    }
    calculateLargestLoss(trades) {
        return Math.min(0, ...trades.map((t) => t.profitOrLoss || 0));
    }
    calculateConsecutiveWins(trades) {
        let maxWins = 0;
        let currentWins = 0;
        trades.forEach((t) => {
            if ((t.profitOrLoss || 0) > 0) {
                currentWins++;
            }
            else {
                if (currentWins > maxWins) {
                    maxWins = currentWins;
                }
                currentWins = 0;
            }
        });
        return maxWins;
    }
    calculateConsecutiveLosses(trades) {
        let maxLosses = 0;
        let currentLosses = 0;
        trades.forEach((t) => {
            if ((t.profitOrLoss || 0) < 0) {
                currentLosses++;
            }
            else {
                if (currentLosses > maxLosses) {
                    maxLosses = currentLosses;
                }
                currentLosses = 0;
            }
        });
        return maxLosses;
    }
    calculateTradesPerDay(trades) {
        if (trades.length === 0)
            return 0;
        const firstDay = trades[0].openTime.getTime();
        const lastDay = trades[trades.length - 1].closeTime?.getTime();
        if (!lastDay)
            return 0;
        const durationInDays = (lastDay - firstDay) / (1000 * 60 * 60 * 24);
        return durationInDays > 0 ? trades.length / durationInDays : trades.length;
    }
    calculateAverageHoldingPeriod(trades) {
        if (trades.length === 0)
            return 0;
        const totalHoldingPeriod = trades.reduce((sum, t) => {
            if (t.openTime && t.closeTime) {
                return sum + (t.closeTime.getTime() - t.openTime.getTime());
            }
            return sum;
        }, 0);
        return totalHoldingPeriod / trades.length / (1000 * 60);
    }
    analyzeDayOfWeek(trades) {
        const analysis = {};
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
            if (!analysis[day]) {
                analysis[day] = { pnl: 0, count: 0 };
            }
            analysis[day].pnl += trade.profitOrLoss || 0;
            analysis[day].count++;
        });
        return analysis;
    }
    analyzeMonthlyPerformance(trades) {
        const analysis = {};
        trades.forEach((trade) => {
            const month = trade.openTime.toISOString().substring(0, 7);
            if (!analysis[month]) {
                analysis[month] = { pnl: 0, count: 0 };
            }
            analysis[month].pnl += trade.profitOrLoss || 0;
            analysis[month].count++;
        });
        return analysis;
    }
    calculateCorrelationMatrix(trades) {
        const assets = [...new Set(trades.map((t) => t.symbol))];
        const matrix = {};
        assets.forEach((asset1) => {
            matrix[asset1] = {};
            assets.forEach((asset2) => {
                if (asset1 === asset2) {
                    matrix[asset1][asset2] = 1;
                }
                else {
                    const trades1 = trades.filter((t) => t.symbol === asset1);
                    const trades2 = trades.filter((t) => t.symbol === asset2);
                    matrix[asset1][asset2] = this.calculateCorrelation(trades1, trades2);
                }
            });
        });
        return matrix;
    }
    calculateCorrelation(trades1, trades2) {
        const returns1 = this.calculateDailyReturns(trades1);
        const returns2 = this.calculateDailyReturns(trades2.slice(0, returns1.length));
        if (returns1.length !== returns2.length || returns1.length === 0)
            return 0;
        const mean1 = returns1.reduce((s, r) => s + r, 0) / returns1.length;
        const mean2 = returns2.reduce((s, r) => s + r, 0) / returns2.length;
        const cov = returns1
            .map((r, i) => (r - mean1) * (returns2[i] - mean2))
            .reduce((s, v) => s + v, 0) /
            (returns1.length - 1);
        const stdDev1 = Math.sqrt(returns1.reduce((s, r) => s + Math.pow(r - mean1, 2), 0) /
            (returns1.length - 1));
        const stdDev2 = Math.sqrt(returns2.reduce((s, r) => s + Math.pow(r - mean2, 2), 0) /
            (returns2.length - 1));
        if (stdDev1 === 0 || stdDev2 === 0)
            return 0;
        return cov / (stdDev1 * stdDev2);
    }
    analyzeSeasonality(trades) {
        const hourlyAnalysis = {};
        const monthlyAnalysis = {};
        trades.forEach((trade) => {
            const hour = trade.openTime.getHours();
            const month = trade.openTime.getMonth();
            if (!hourlyAnalysis[hour]) {
                hourlyAnalysis[hour] = { pnl: 0, count: 0 };
            }
            hourlyAnalysis[hour].pnl += trade.profitOrLoss || 0;
            hourlyAnalysis[hour].count++;
            if (!monthlyAnalysis[month]) {
                monthlyAnalysis[month] = { pnl: 0, count: 0 };
            }
            monthlyAnalysis[month].pnl += trade.profitOrLoss || 0;
            monthlyAnalysis[month].count++;
        });
        return {
            hourly: hourlyAnalysis,
            monthly: monthlyAnalysis,
        };
    }
    analyzeDrawdowns(drawdowns) {
        const drawdownPeriods = [];
        let inDrawdown = false;
        let start = 0;
        let peak = 0;
        let trough = 0;
        let recovery = 0;
        drawdowns.forEach((d, i) => {
            if (d < 0 && !inDrawdown) {
                inDrawdown = true;
                start = i;
                peak = d;
                trough = d;
            }
            else if (d < 0 && inDrawdown) {
                if (d < trough)
                    trough = d;
            }
            else if (d >= 0 && inDrawdown) {
                inDrawdown = false;
                recovery = i;
                drawdownPeriods.push({
                    start,
                    end: recovery,
                    duration: recovery - start,
                    peak,
                    trough,
                });
            }
        });
        return drawdownPeriods;
    }
    identifyTradingPatterns(trades) {
        if (trades.length < 2) {
            return [];
        }
        const patterns = [];
        const revengeTrading = this.detectRevengeTradingPattern(trades);
        if (revengeTrading.detected) {
            patterns.push({
                name: 'Revenge Trading',
                details: `Detected ${revengeTrading.count} instances of large trades after a loss.`,
            });
        }
        const overtrading = this.detectOvertradingPattern(trades);
        if (overtrading.detected) {
            patterns.push({
                name: 'Overtrading',
                details: `Detected ${overtrading.count} days with an unusually high number of trades.`,
            });
        }
        return patterns;
    }
    detectRevengeTradingPattern(trades) {
        let count = 0;
        for (let i = 1; i < trades.length; i++) {
            if (trades[i - 1].profitOrLoss < 0 &&
                (trades[i].profitOrLoss || 0) > (trades[i - 1].profitOrLoss || 0) * 1.5) {
                count++;
            }
        }
        return { detected: count > 0, count };
    }
    detectOvertradingPattern(trades) {
        const tradesByDay = new Map();
        trades.forEach((t) => {
            const day = t.openTime.toISOString().split('T')[0];
            tradesByDay.set(day, (tradesByDay.get(day) || 0) + 1);
        });
        const averageTradesPerDay = Array.from(tradesByDay.values()).reduce((sum, count) => sum + count, 0) /
            tradesByDay.size;
        const overtradingDays = Array.from(tradesByDay.values()).filter((count) => count > averageTradesPerDay * 2).length;
        return { detected: overtradingDays > 0, count: overtradingDays };
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