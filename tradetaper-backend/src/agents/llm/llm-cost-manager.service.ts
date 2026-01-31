import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * LLM Cost Manager Service
 * 
 * Manages token usage, costs, and budgets across all LLM operations.
 * Provides cost tracking, budget enforcement, and optimization.
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  timestamp: Date;
  userId?: string;
  operation: string;
}

export interface ModelPricing {
  model: string;
  provider: string;
  promptCostPer1K: number;
  completionCostPer1K: number;
  contextWindow: number;
  recommended: boolean;
}

export interface UserBudget {
  userId: string;
  monthlyBudget: number;
  currentUsage: number;
  percentUsed: number;
  remainingBudget: number;
  resetDate: Date;
}

export class BudgetExceededException extends Error {
  constructor(
    message: string,
    public readonly userId: string,
    public readonly currentUsage: number,
    public readonly budget: number,
  ) {
    super(message);
    this.name = 'BudgetExceededException';
  }
}

@Injectable()
export class LLMCostManagerService {
  private readonly logger = new Logger(LLMCostManagerService.name);
  
  // Model pricing (as of 2024/2025 - update regularly)
  private readonly modelPricing: Map<string, ModelPricing> = new Map([
    [
      'gemini-3-pro-preview',
      {
        model: 'gemini-3-pro-preview',
        provider: 'google',
        promptCostPer1K: 0.00125,
        completionCostPer1K: 0.005,
        contextWindow: 1000000,
        recommended: true,
      },
    ],
    [
      'gemini-1.5-flash',
      {
        model: 'gemini-1.5-flash',
        provider: 'google',
        promptCostPer1K: 0.0001875,
        completionCostPer1K: 0.000375,
        contextWindow: 1000000,
        recommended: true,
      },
    ],
    [
      'gemini-1.5-pro',
      {
        model: 'gemini-1.5-pro',
        provider: 'google',
        promptCostPer1K: 0.00125,
        completionCostPer1K: 0.005,
        contextWindow: 2000000,
        recommended: false,
      },
    ],
    [
      'gpt-4-turbo',
      {
        model: 'gpt-4-turbo',
        provider: 'openai',
        promptCostPer1K: 0.01,
        completionCostPer1K: 0.03,
        contextWindow: 128000,
        recommended: false,
      },
    ],
    [
      'claude-3-sonnet',
      {
        model: 'claude-3-sonnet',
        provider: 'anthropic',
        promptCostPer1K: 0.003,
        completionCostPer1K: 0.015,
        contextWindow: 2000000,
        recommended: true,
      },
    ],
  ]);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string,
  ): number {
    const pricing = this.modelPricing.get(model);
    if (!pricing) {
      this.logger.warn(`Unknown model pricing: ${model}, using default`);
      return (promptTokens / 1000) * 0.0001875 + (completionTokens / 1000) * 0.000375;
    }
    return (promptTokens / 1000) * pricing.promptCostPer1K + (completionTokens / 1000) * pricing.completionCostPer1K;
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async recordUsage(usage: Omit<TokenUsage, 'timestamp'>): Promise<void> {
    const tokenUsage: TokenUsage = { ...usage, timestamp: new Date() };
    const key = `token-usage:${tokenUsage.userId || 'system'}:${Date.now()}`;
    await this.cacheManager.set(key, tokenUsage, 86400000);
    if (tokenUsage.userId) await this.updateUserUsage(tokenUsage.userId, tokenUsage.cost);
    await this.updateSystemStats(tokenUsage);
    this.logger.debug(`Recorded usage: ${tokenUsage.totalTokens} tokens, $${tokenUsage.cost.toFixed(6)} (model: ${tokenUsage.model})`);
  }

  async checkBudget(userId: string, estimatedCost: number): Promise<void> {
    const budget = await this.getUserBudget(userId);
    if (budget.currentUsage + estimatedCost > budget.monthlyBudget) {
      throw new BudgetExceededException(
        `AI token budget exceeded. Current: $${budget.currentUsage.toFixed(2)}, Budget: $${budget.monthlyBudget.toFixed(2)}`,
        userId, budget.currentUsage, budget.monthlyBudget,
      );
    }
  }

  async getUserBudget(userId: string): Promise<UserBudget> {
    const subscriptionTier = await this.getUserSubscriptionTier(userId);
    const monthlyBudgets = { free: 1.0, basic: 5.0, pro: 25.0, enterprise: 1000.0 };
    const monthlyBudget = monthlyBudgets[subscriptionTier] || monthlyBudgets.free;
    const currentUsage = await this.getUserMonthlyUsage(userId);
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { userId, monthlyBudget, currentUsage, percentUsed: (currentUsage / monthlyBudget) * 100, remainingBudget: monthlyBudget - currentUsage, resetDate };
  }

  private async getUserMonthlyUsage(userId: string): Promise<number> {
    const key = `monthly-usage:${userId}:${this.getCurrentYearMonth()}`;
    const usage = await this.cacheManager.get<number>(key);
    return usage || 0;
  }

  private async updateUserUsage(userId: string, cost: number): Promise<void> {
    const key = `monthly-usage:${userId}:${this.getCurrentYearMonth()}`;
    const currentUsage = await this.getUserMonthlyUsage(userId);
    await this.cacheManager.set(key, currentUsage + cost, this.getTTLUntilEndOfNextMonth());
  }

  selectOptimalModel(taskComplexity: 'simple' | 'medium' | 'complex', maxCost?: number): string {
    let recommendedModels: string[];
    switch (taskComplexity) {
      case 'simple': recommendedModels = ['gemini-1.5-flash']; break;
      case 'medium': recommendedModels = ['gemini-1.5-flash']; break;
      case 'complex': recommendedModels = ['gemini-3-pro-preview', 'gemini-1.5-pro']; break;
    }
    if (maxCost) {
      recommendedModels = recommendedModels.filter(model => {
        const pricing = this.modelPricing.get(model);
        return pricing && pricing.promptCostPer1K <= maxCost;
      });
    }
    return recommendedModels[0] || 'gemini-1.5-flash';
  }

  async getSystemStats(): Promise<any> {
    const key = 'system-stats:tokens';
    const stats = await this.cacheManager.get<any>(key);
    return stats || { totalTokens: 0, totalCost: 0, totalRequests: 0, costByModel: {}, topUsers: [] };
  }

  private async updateSystemStats(usage: TokenUsage): Promise<void> {
    const key = 'system-stats:tokens';
    const stats = await this.getSystemStats();
    stats.totalTokens += usage.totalTokens;
    stats.totalCost += usage.cost;
    stats.totalRequests += 1;
    if (!stats.costByModel[usage.model]) stats.costByModel[usage.model] = 0;
    stats.costByModel[usage.model] += usage.cost;
    await this.cacheManager.set(key, stats, 86400000);
  }

  private async getUserSubscriptionTier(userId: string): Promise<string> {
    const key = `user-tier:${userId}`;
    const tier = await this.cacheManager.get<string>(key);
    return tier || 'free';
  }

  private getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  private getTTLUntilEndOfNextMonth(): number {
    const now = new Date();
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    return endOfNextMonth.getTime() - now.getTime();
  }

  getAllModelPricing(): ModelPricing[] {
    return Array.from(this.modelPricing.values());
  }
}
