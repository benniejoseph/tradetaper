import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

/**
 * LLM Cost Manager Service
 * 
 * Manages token usage, costs, and budgets across all LLM operations.
 * Provides cost tracking, budget enforcement, and optimization.
 * 
 * Features:
 * - Token counting and cost calculation
 * - Per-user budget enforcement
 * - Cost tracking and analytics
 * - Model cost comparison
 * - Budget alerts
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
  
  // Model pricing (as of 2024 - update regularly)
  private readonly modelPricing: Map<string, ModelPricing> = new Map([
    [
      'gemini-1.5-flash',
      {
        model: 'gemini-1.5-flash',
        provider: 'google',
        promptCostPer1K: 0.0001875, // $0.0001875 per 1K tokens
        completionCostPer1K: 0.000375, // $0.000375 per 1K tokens
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
      'gpt-3.5-turbo',
      {
        model: 'gpt-3.5-turbo',
        provider: 'openai',
        promptCostPer1K: 0.0015,
        completionCostPer1K: 0.002,
        contextWindow: 16385,
        recommended: true,
      },
    ],
    [
      'claude-3-sonnet',
      {
        model: 'claude-3-sonnet',
        provider: 'anthropic',
        promptCostPer1K: 0.003,
        completionCostPer1K: 0.015,
        contextWindow: 200000,
        recommended: true,
      },
    ],
  ]);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  /**
   * Calculate cost for token usage
   */
  calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string,
  ): number {
    const pricing = this.modelPricing.get(model);
    
    if (!pricing) {
      this.logger.warn(`Unknown model pricing: ${model}, using default`);
      // Default to Gemini Flash pricing
      return (
        (promptTokens / 1000) * 0.0001875 +
        (completionTokens / 1000) * 0.000375
      );
    }
    
    const promptCost = (promptTokens / 1000) * pricing.promptCostPer1K;
    const completionCost = (completionTokens / 1000) * pricing.completionCostPer1K;
    
    return promptCost + completionCost;
  }

  /**
   * Estimate tokens in text (rough approximation)
   * 1 token ≈ 4 characters or 0.75 words
   */
  estimateTokens(text: string): number {
    // More accurate would use tiktoken library
    return Math.ceil(text.length / 4);
  }

  /**
   * Record token usage
   */
  async recordUsage(usage: Omit<TokenUsage, 'timestamp'>): Promise<void> {
    const tokenUsage: TokenUsage = {
      ...usage,
      timestamp: new Date(),
    };
    
    // Store in cache for quick access
    const key = `token-usage:${tokenUsage.userId || 'system'}:${Date.now()}`;
    await this.cacheManager.set(key, tokenUsage, 86400000); // 24 hour TTL
    
    // Update user's monthly usage
    if (tokenUsage.userId) {
      await this.updateUserUsage(tokenUsage.userId, tokenUsage.cost);
    }
    
    // Update system-wide stats
    await this.updateSystemStats(tokenUsage);
    
    this.logger.debug(
      `Recorded usage: ${tokenUsage.totalTokens} tokens, $${tokenUsage.cost.toFixed(6)} (model: ${tokenUsage.model})`
    );
  }

  /**
   * Check if user can make a request (budget enforcement)
   */
  async checkBudget(userId: string, estimatedCost: number): Promise<void> {
    const budget = await this.getUserBudget(userId);
    
    if (budget.currentUsage + estimatedCost > budget.monthlyBudget) {
      throw new BudgetExceededException(
        `AI token budget exceeded. Current: $${budget.currentUsage.toFixed(2)}, ` +
        `Budget: $${budget.monthlyBudget.toFixed(2)}, ` +
        `Estimated cost: $${estimatedCost.toFixed(4)}`,
        userId,
        budget.currentUsage,
        budget.monthlyBudget,
      );
    }
    
    // Warn at 80% usage
    if (budget.percentUsed >= 80 && budget.percentUsed < 100) {
      this.logger.warn(
        `User ${userId} at ${budget.percentUsed.toFixed(1)}% of AI budget`
      );
    }
  }

  /**
   * Get user's budget and usage
   */
  async getUserBudget(userId: string): Promise<UserBudget> {
    // Get user's subscription tier (would come from subscriptions service)
    const subscriptionTier = await this.getUserSubscriptionTier(userId);
    
    // Default budgets by tier
    const monthlyBudgets = {
      free: 1.0, // $1/month
      basic: 5.0, // $5/month
      pro: 25.0, // $25/month
      enterprise: 1000.0, // $1000/month
    };
    
    const monthlyBudget = monthlyBudgets[subscriptionTier] || monthlyBudgets.free;
    
    // Get current month's usage
    const currentUsage = await this.getUserMonthlyUsage(userId);
    
    // Calculate reset date (first day of next month)
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      userId,
      monthlyBudget,
      currentUsage,
      percentUsed: (currentUsage / monthlyBudget) * 100,
      remainingBudget: monthlyBudget - currentUsage,
      resetDate,
    };
  }

  /**
   * Get user's current month usage
   */
  private async getUserMonthlyUsage(userId: string): Promise<number> {
    const key = `monthly-usage:${userId}:${this.getCurrentYearMonth()}`;
    const usage = await this.cacheManager.get<number>(key);
    return usage || 0;
  }

  /**
   * Update user's monthly usage
   */
  private async updateUserUsage(userId: string, cost: number): Promise<void> {
    const key = `monthly-usage:${userId}:${this.getCurrentYearMonth()}`;
    const currentUsage = await this.getUserMonthlyUsage(userId);
    const newUsage = currentUsage + cost;
    
    // Store until end of next month
    const ttl = this.getTTLUntilEndOfNextMonth();
    await this.cacheManager.set(key, newUsage, ttl);
  }

  /**
   * Get recommended model based on task complexity
   */
  selectOptimalModel(
    taskComplexity: 'simple' | 'medium' | 'complex',
    maxCost?: number,
  ): string {
    let recommendedModels: string[];
    
    switch (taskComplexity) {
      case 'simple':
        recommendedModels = ['gemini-1.5-flash', 'gpt-3.5-turbo'];
        break;
      case 'medium':
        recommendedModels = ['claude-3-sonnet', 'gemini-1.5-flash', 'gpt-3.5-turbo'];
        break;
      case 'complex':
        recommendedModels = ['gpt-4-turbo', 'gemini-1.5-pro', 'claude-3-sonnet'];
        break;
    }
    
    // If max cost specified, filter by cost
    if (maxCost) {
      recommendedModels = recommendedModels.filter(model => {
        const pricing = this.modelPricing.get(model);
        return pricing && pricing.promptCostPer1K <= maxCost;
      });
    }
    
    return recommendedModels[0] || 'gemini-1.5-flash';
  }

  /**
   * Get system-wide statistics
   */
  async getSystemStats(): Promise<{
    totalTokens: number;
    totalCost: number;
    totalRequests: number;
    costByModel: Record<string, number>;
    topUsers: Array<{ userId: string; cost: number }>;
  }> {
    const key = 'system-stats:tokens';
    const stats = await this.cacheManager.get<any>(key);
    
    return stats || {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: 0,
      costByModel: {},
      topUsers: [],
    };
  }

  /**
   * Update system-wide statistics
   */
  private async updateSystemStats(usage: TokenUsage): Promise<void> {
    const key = 'system-stats:tokens';
    const stats = await this.getSystemStats();
    
    stats.totalTokens += usage.totalTokens;
    stats.totalCost += usage.cost;
    stats.totalRequests += 1;
    
    // Update cost by model
    if (!stats.costByModel[usage.model]) {
      stats.costByModel[usage.model] = 0;
    }
    stats.costByModel[usage.model] += usage.cost;
    
    await this.cacheManager.set(key, stats, 86400000); // 24 hours
  }

  /**
   * Get user's subscription tier (placeholder - integrate with actual subscriptions)
   */
  private async getUserSubscriptionTier(userId: string): Promise<string> {
    // TODO: Integrate with actual subscriptions service
    const key = `user-tier:${userId}`;
    const tier = await this.cacheManager.get<string>(key);
    return tier || 'free';
  }

  /**
   * Helper: Get current year-month string
   */
  private getCurrentYearMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Get TTL until end of next month
   */
  private getTTLUntilEndOfNextMonth(): number {
    const now = new Date();
    const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    return endOfNextMonth.getTime() - now.getTime();
  }

  /**
   * Get all model pricing
   */
  getAllModelPricing(): ModelPricing[] {
    return Array.from(this.modelPricing.values());
  }
}

