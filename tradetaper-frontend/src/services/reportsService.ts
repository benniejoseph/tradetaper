import { authApiClient } from './api';

export interface WeeklyReportInsightItem {
  title: string;
  detail: string;
}

export interface WeeklyReportImprovementItem {
  action: string;
  target: string;
  timeHorizon: string;
}

export interface WeeklyReportAiSummary {
  executiveSummary: string;
  strengths: WeeklyReportInsightItem[];
  weaknesses: WeeklyReportInsightItem[];
  improvementPlan: WeeklyReportImprovementItem[];
  bestSetup: string;
  worstPattern: string;
  riskAlerts: string[];
  confidence: number;
}

export interface WeeklyReportTradeSnapshot {
  tradeId: string;
  symbol: string;
  side: string;
  pnl: number;
  openTime?: string;
  closeTime?: string;
  holdMinutes?: number | null;
}

export interface WeeklyReportSymbolBreakdown {
  symbol: string;
  trades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netPnl: number;
}

export interface WeeklyReport {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  totalTrades: number | string;
  winningTrades: number | string;
  losingTrades: number | string;
  winRate: number | string;
  netPnl: number | string;
  expectancy: number | string;
  profitFactor: number | string;
  averageWin: number | string;
  averageLoss: number | string;
  bestTrade?: WeeklyReportTradeSnapshot | null;
  worstTrade?: WeeklyReportTradeSnapshot | null;
  symbolBreakdown?: WeeklyReportSymbolBreakdown[] | null;
  aiModel?: string | null;
  aiSummary?: WeeklyReportAiSummary | null;
  aiGeneratedAt?: string | null;
  emailedAt?: string | null;
  sourceNotificationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReportListResponse {
  data: WeeklyReport[];
  total: number;
  page: number;
  limit: number;
}

class ReportsService {
  async listReports(page = 1, limit = 12): Promise<WeeklyReportListResponse> {
    const response = await authApiClient.get<WeeklyReportListResponse>(
      '/reports',
      {
        params: { page, limit },
      },
    );
    return response.data;
  }

  async getReport(reportId: string): Promise<WeeklyReport> {
    const response = await authApiClient.get<WeeklyReport>(`/reports/${reportId}`);
    return response.data;
  }

  async resendReportEmail(reportId: string): Promise<{
    success: boolean;
    reportId: string;
    emailedAt?: string | null;
  }> {
    const response = await authApiClient.post(`/reports/${reportId}/resend-email`);
    return response.data;
  }

  async generateLatestReport(): Promise<WeeklyReport> {
    const response = await authApiClient.post<WeeklyReport>(
      '/reports/generate/latest',
    );
    return response.data;
  }
}

export const reportsService = new ReportsService();

