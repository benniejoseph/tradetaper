import { Injectable, Logger } from '@nestjs/common';
import { Trade } from '../trades/entities/trade.entity';
import { TradeStatus, TradeDirection, ICTConcept, TradingSession } from '../types/enums';
import { getHours, getDay, differenceInMinutes, parseISO } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  calculateAdvancedMetrics(trades: Trade[]) {
    const closedTrades = trades.filter((t) => t.status === TradeStatus.CLOSED && t.profitOrLoss !== undefined);

    if (closedTrades.length === 0) {
      return null;
    }

    return {
      hourlyPerformance: this.getHourlyPerformance(closedTrades),
      sessionPerformance: this.getSessionPerformance(closedTrades),
      holdingTimeAnalysis: this.getHoldingTimeAnalysis(closedTrades),
      winRateByConcept: this.getWinRateByConcept(closedTrades),
      assetPerformance: this.getAssetPerformance(closedTrades),
      radarMetrics: this.getRadarMetrics(closedTrades),
    };
  }

  private getHourlyPerformance(trades: Trade[]) {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, pnl: 0, count: 0, wins: 0 }));

    trades.forEach((trade) => {
        if (!trade.openTime) return;
        const date = typeof trade.openTime === 'string' ? parseISO(trade.openTime) : trade.openTime;
        const hour = getHours(date);
        
        hours[hour].pnl += Number(trade.profitOrLoss || 0);
        hours[hour].count += 1;
        if ((trade.profitOrLoss || 0) > 0) hours[hour].wins += 1;
    });

    return hours.map(h => ({
        ...h,
        winRate: h.count > 0 ? (h.wins / h.count) * 100 : 0
    })).filter(h => h.count > 0).sort((a, b) => a.hour - b.hour);
  }

  private getSessionPerformance(trades: Trade[]) {
    const sessions: Record<string, { pnl: 0, count: 0, wins: 0 }> = {};

    trades.forEach((trade) => {
      const session = trade.session || 'Unknown';
      if (!sessions[session]) sessions[session] = { pnl: 0, count: 0, wins: 0 };
      
      sessions[session].pnl += Number(trade.profitOrLoss || 0);
      sessions[session].count += 1;
      if ((trade.profitOrLoss || 0) > 0) sessions[session].wins += 1;
    });

    return Object.entries(sessions).map(([session, data]) => ({
      session,
      pnl: data.pnl,
      count: data.count,
      winRate: (data.wins / data.count) * 100,
    })).sort((a, b) => b.pnl - a.pnl);
  }

  private getRadarMetrics(trades: Trade[]) {
        const wins = trades.filter(t => (t.profitOrLoss || 0) > 0).length;
        const total = trades.length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;
  
        // 2. Risk Reward (Normalized 0-100 for chart, where 1:3 = 100)
        const avgWin = trades.filter(t => (t.profitOrLoss || 0) > 0)
            .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0) / (wins || 1);
        const avgLoss = Math.abs(trades.filter(t => (t.profitOrLoss || 0) < 0)
            .reduce((sum, t) => sum + (t.profitOrLoss || 0), 0)) / ((total - wins) || 1);
        const rr = avgLoss > 0 ? avgWin / avgLoss : 0;
        const rrScore = Math.min((rr / 3) * 100, 100);
  
        // 3. Consistency (Win Streak Stability / Low Variance)
        const winningPnLs = trades.filter(t => (t.profitOrLoss || 0) > 0).map(t => Number(t.profitOrLoss || 0));
        let consistencyScore = 50; // Default
        if (winningPnLs.length > 2) {
            const meanWin = winningPnLs.reduce((a,b)=>a+b,0) / winningPnLs.length;
            const variance = winningPnLs.reduce((a,b)=>a + Math.pow(b - meanWin, 2), 0) / winningPnLs.length;
            const stdev = Math.sqrt(variance);
            const cov = meanWin > 0 ? stdev / meanWin : 1;
            consistencyScore = Math.max(0, Math.min(100, 100 - (cov * 50)));
        }
  
        // 4. Calmar Ratio (Annualized Return / Max Drawdown)
        let peak = -Infinity;
        let maxDd = 0;
        let runningPnl = 0;
        // Process trades chronologically (oldest to newest) for drawdown
        const sortedTrades = [...trades].sort((a,b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());
        sortedTrades.forEach(t => { 
            runningPnl += Number(t.profitOrLoss || 0);
            if (runningPnl > peak) peak = runningPnl;
            const dd = peak - runningPnl;
            if (dd > maxDd) maxDd = dd;
        });
        const totalReturn = trades.reduce((sum, t) => sum + Number(t.profitOrLoss || 0), 0);
        const calmar = maxDd > 0 ? totalReturn / maxDd : totalReturn > 0 ? 5 : 0; // If no DD, high score
        const calmarScore = Math.min((calmar / 3) * 100, 100);
  
        // 5. Daily Return (Profit Factor proxy)
        const grossProfit = trades.filter(t => (t.profitOrLoss || 0) > 0).reduce((s,t) => s + (t.profitOrLoss || 0), 0);
        const grossLoss = Math.abs(trades.filter(t => (t.profitOrLoss || 0) < 0).reduce((s,t) => s + (t.profitOrLoss || 0), 0));
        const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 5 : 1;
        const dailyReturnScore = Math.min((profitFactor / 3) * 100, 100);
  
        // 6. SL Usage
        const tradesWithSL = trades.filter(t => t.stopLoss !== null && t.stopLoss !== undefined).length;
        const slUsageScore = total > 0 ? (tradesWithSL / total) * 100 : 0;
  
        return [
            { subject: 'Consistency', A: Math.round(consistencyScore), fullMark: 100 },
            { subject: 'Daily Return', A: Math.round(dailyReturnScore), fullMark: 100 },
            { subject: 'RR', A: Math.round(rrScore), fullMark: 100 },
            { subject: 'Win Rate', A: Math.round(winRate), fullMark: 100 },
            { subject: 'SL Usage', A: Math.round(slUsageScore), fullMark: 100 },
            { subject: 'Calmar Ratio', A: Math.round(calmarScore), fullMark: 100 },
        ];
  }

  private getHoldingTimeAnalysis(trades: Trade[]) {
    return trades.map((trade) => {
        if (!trade.openTime || !trade.closeTime) return null;
        const open = typeof trade.openTime === 'string' ? parseISO(trade.openTime) : trade.openTime;
        const close = typeof trade.closeTime === 'string' ? parseISO(trade.closeTime) : trade.closeTime;
        
        const durationMinutes = differenceInMinutes(close, open);
        
        return {
            id: trade.id,
            durationMinutes,
            pnl: Number(trade.profitOrLoss || 0),
            isWin: (trade.profitOrLoss || 0) > 0
        };
    }).filter(t => t !== null && t.durationMinutes >= 0 && t.durationMinutes < 10000); // Filter anomalies
  }

  private getWinRateByConcept(trades: Trade[]) {
      const concepts: Record<string, { wins: 0, count: 0 }> = {};

      trades.forEach((trade) => {
          const concept = trade.ictConcept || 'None';
          if (!concepts[concept]) concepts[concept] = { wins: 0, count: 0 };

          concepts[concept].count += 1;
          if ((trade.profitOrLoss || 0) > 0) concepts[concept].wins += 1;
      });

      return Object.entries(concepts).map(([concept, data]) => ({
          concept,
          winRate: (data.wins / data.count) * 100,
          count: data.count
      })).sort((a, b) => b.winRate - a.winRate);
  }

  private getAssetPerformance(trades: Trade[]) {
      const assets: Record<string, { pnl: 0, count: 0 }> = {};

      trades.forEach((trade) => {
          const symbol = trade.symbol;
          if (!assets[symbol]) assets[symbol] = { pnl: 0, count: 0 };

          assets[symbol].pnl += Number(trade.profitOrLoss || 0);
          assets[symbol].count += 1;
      });

      return Object.entries(assets).map(([symbol, data]) => ({
          symbol,
          pnl: data.pnl,
          count: data.count
      })).sort((a, b) => b.pnl - a.pnl).slice(0, 10); // Top 10
  }
}
