// src/services/disciplineService.ts
import { authApiClient } from './api';

// ==================== Types ====================

export interface ChecklistResponse {
  itemId: string;
  text: string;
  checked: boolean;
}

export interface TradeApproval {
  id: string;
  userId: string;
  accountId?: string;
  strategyId?: string;
  symbol: string;
  direction: 'Long' | 'Short';
  checklistResponses: ChecklistResponse[];
  riskPercent: number;
  calculatedLotSize?: number;
  stopLoss?: number;
  takeProfit?: number;
  status: 'pending' | 'approved' | 'executed' | 'expired' | 'rejected';
  approvedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt?: Date;
}

export interface TraderDiscipline {
  id: string;
  userId: string;
  xpTotal: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  disciplineScore: number;
  totalApprovedTrades: number;
  totalExecutedTrades: number;
  totalRuleViolations: number;
  totalUnauthorizedTrades: number;
  badges: Badge[];
  lastTradeAt?: string;
}

export interface CooldownSession {
  id: string;
  userId: string;
  triggerReason: string;
  durationMinutes: number;
  exercisesCompleted: { exerciseId: string; name: string; completedAt: Date }[];
  requiredExercises: string[];
  isCompleted: boolean;
  isSkipped: boolean;
  startedAt: string;
  completedAt?: string;
  expiresAt?: string;
}

export interface CreateApprovalDto {
  accountId?: string;
  strategyId?: string;
  symbol: string;
  direction: 'Long' | 'Short';
  riskPercent: number;
  checklistResponses: ChecklistResponse[];
}

export interface ApproveTradeDto {
  calculatedLotSize: number;
  stopLoss: number;
  takeProfit?: number;
}

// ==================== API Functions ====================

export const disciplineService = {
  // Get discipline stats (XP, level, badges, etc.)
  getStats: async (): Promise<TraderDiscipline> => {
    const response = await authApiClient.get('/discipline/stats');
    return response.data;
  },

  // Create a trade approval request
  createApproval: async (dto: CreateApprovalDto): Promise<TradeApproval> => {
    const response = await authApiClient.post('/discipline/approvals', dto);
    return response.data;
  },

  // Approve and unlock MT5 for trading
  approveAndUnlock: async (approvalId: string, dto: ApproveTradeDto): Promise<TradeApproval> => {
    const response = await authApiClient.post(`/discipline/approvals/${approvalId}/approve`, dto);
    return response.data;
  },

  // Get active (approved but not executed) approval
  getActiveApproval: async (): Promise<TradeApproval | null> => {
    const response = await authApiClient.get('/discipline/approvals/active');
    return response.data;
  },

  // Get pending approvals
  getPendingApprovals: async (): Promise<TradeApproval[]> => {
    const response = await authApiClient.get('/discipline/approvals/pending');
    return response.data;
  },

  // Get approval history
  getApprovalHistory: async (): Promise<TradeApproval[]> => {
    const response = await authApiClient.get('/discipline/approvals/history');
    return response.data;
  },

  // Get active cooldown session
  getActiveCooldown: async (): Promise<CooldownSession | null> => {
    const response = await authApiClient.get('/discipline/cooldowns/active');
    return response.data;
  },

  // Complete an exercise in a cooldown
  completeExercise: async (cooldownId: string, exerciseId: string): Promise<CooldownSession> => {
    const response = await authApiClient.post(`/discipline/cooldowns/${cooldownId}/complete-exercise`, {
      exerciseId,
    });
    return response.data;
  },

  // Skip cooldown (will incur penalty)
  skipCooldown: async (cooldownId: string): Promise<CooldownSession> => {
    const response = await authApiClient.post(`/discipline/cooldowns/${cooldownId}/skip`);
    return response.data;
  },

  // Get cooldown history
  getCooldownHistory: async (): Promise<CooldownSession[]> => {
    const response = await authApiClient.get('/discipline/cooldowns/history');
    return response.data;
  },
};

export default disciplineService;
