import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseAgent } from '../base/base-agent';
import {
  AgentCapability,
  AgentMessage,
  AgentResponse,
} from '../interfaces/agent.interface';
import { AgentRegistryService } from '../agent-registry.service';
import { EventBusService } from '../event-bus.service';
import { MultiModelOrchestratorService } from '../llm/multi-model-orchestrator.service';
import { Trade } from '../../trades/entities/trade.entity';
import { MT5Account } from '../../users/entities/mt5-account.entity';
import { Account } from '../../users/entities/account.entity';

type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

@Injectable()
export class TraderPsychCoachAgent extends BaseAgent {
  readonly agentId = 'trader-psych-coach-agent';
  readonly name = 'Trader Psychology Coach Agent';
  readonly priority = 96;

  readonly capabilities: AgentCapability[] = [
    {
      id: 'trader-psych-coach-chat',
      description:
        'Expert trader and psychologist chat coach using the user trade history across accounts',
      keywords: [
        'coach',
        'trader',
        'psychology',
        'discipline',
        'review',
        'performance',
        'insight',
        'ai chat',
      ],
    },
  ];

  constructor(
    registry: AgentRegistryService,
    eventBus: EventBusService,
    private readonly llm: MultiModelOrchestratorService,
    @InjectRepository(Trade)
    private readonly tradeRepo: Repository<Trade>,
    @InjectRepository(MT5Account)
    private readonly mt5AccountRepo: Repository<MT5Account>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
  ) {
    super(registry, eventBus);
  }

  protected async processMessage(
    message: AgentMessage,
  ): Promise<AgentResponse> {
    const { payload, context } = message;
    const action = payload.action || 'chat';

    if (action !== 'chat' && action !== 'coach-chat') {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ACTION',
          message: `Unknown action: ${action}`,
        },
      };
    }

    return this.handleCoachChat(payload, context.userId);
  }

  private async handleCoachChat(
    payload: {
      message?: string;
      question?: string;
      accountId?: string;
      history?: ChatHistoryMessage[];
    },
    userId: string,
  ): Promise<AgentResponse> {
    const question = String(payload.message || payload.question || '').trim();
    if (!question) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message is required',
        },
      };
    }

    const accountId = this.normalizeString(payload.accountId);
    const history = this.normalizeHistory(payload.history);

    const whereClause: FindOptionsWhere<Trade> = accountId
      ? { userId, accountId }
      : { userId };
    const trades = await this.tradeRepo.find({
      where: whereClause,
      relations: ['tags'],
      order: { openTime: 'DESC' },
    });

    const [mt5Accounts, regularAccounts] = await Promise.all([
      this.mt5AccountRepo.find({ where: { userId } }),
      this.accountRepo.find({ where: { userId } }),
    ]);

    const accountNameById = new Map<string, string>();
    for (const account of mt5Accounts) {
      accountNameById.set(account.id, account.accountName);
    }
    for (const account of regularAccounts) {
      accountNameById.set(account.id, account.name);
    }

    const summary = this.buildSummary(trades, accountNameById, accountId);
    const detailedLimit = 220;
    const detailedRecords = trades
      .slice(0, detailedLimit)
      .map((trade) => this.serializeTrade(trade, accountNameById));

    const historyBlock = history
      .slice(-8)
      .map((item, idx) => `${idx + 1}. ${item.role.toUpperCase()}: ${item.content}`)
      .join('\n');

    const prompt = `
You are "TradeTaper Coach" — a direct, elite trader coach and trading psychologist.
You must combine technical performance review + behavioral coaching using only the user data provided.

Rules:
- Never fabricate trades, numbers, or fields.
- If data is missing, explicitly say what is missing.
- Stay practical and actionable.
- Give coaching in this order:
  1) Immediate diagnosis
  2) Performance breakdown
  3) Psychology/discipline pattern
  4) Concrete next-5-trades plan
  5) Risk warnings
- Keep it readable with short sections and bullet points.
- Educational coaching only (not investment advice).

Conversation history (recent):
${historyBlock || 'No prior messages.'}

User question:
${question}

Scope:
${accountId ? `Single account (${accountId})` : 'All accounts'}

User trade analytics summary (computed from full trade set):
${JSON.stringify(summary)}

Detailed trade records (latest ${detailedLimit}; includes all available fields in each record):
${JSON.stringify(detailedRecords)}

Return a single concise coaching response in markdown.
`;

    const llmResponse = await this.llm.complete({
      prompt,
      modelPreference: 'gemini-3-pro-preview',
      taskComplexity: 'complex',
      optimizeFor: 'quality',
      maxTokens: 2200,
      userId,
    });

    return {
      success: true,
      data: {
        answer: llmResponse.content,
        context: {
          accountId: accountId || null,
          totalTrades: summary.totalTrades,
          closedTrades: summary.closedTrades,
          openTrades: summary.openTrades,
          netPnL: summary.netPnL,
          detailedRecordsProvided: detailedRecords.length,
          recordsAnalyzed: trades.length,
        },
      },
    };
  }

  private normalizeString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private normalizeHistory(value: unknown): ChatHistoryMessage[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .filter(
        (item): item is ChatHistoryMessage =>
          !!item &&
          typeof item === 'object' &&
          (item as ChatHistoryMessage).role !== undefined &&
          (item as ChatHistoryMessage).content !== undefined,
      )
      .map((item): ChatHistoryMessage => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: String(item.content || '').slice(0, 4000),
      }))
      .filter((item) => item.content.trim().length > 0);
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const converted =
      typeof value === 'number' ? value : Number.parseFloat(String(value));
    return Number.isFinite(converted) ? converted : 0;
  }

  private buildSummary(
    trades: Trade[],
    accountNameById: Map<string, string>,
    scopedAccountId?: string,
  ): Record<string, unknown> {
    let closedTrades = 0;
    let openTrades = 0;
    let wins = 0;
    let losses = 0;
    let breakeven = 0;
    let netPnL = 0;
    let totalWin = 0;
    let totalLossAbs = 0;
    let totalRMultiple = 0;
    let rMultipleCount = 0;
    let followedPlanYes = 0;
    let followedPlanTracked = 0;
    let totalRuleViolations = 0;

    const symbolStats = new Map<
      string,
      { count: number; netPnL: number; wins: number; losses: number }
    >();
    const accountStats = new Map<string, { count: number; netPnL: number }>();
    const emotionCounts = new Map<string, number>();
    const sessionStats = new Map<string, { count: number; netPnL: number }>();

    for (const trade of trades) {
      const pnl = this.toNumber(trade.profitOrLoss);
      netPnL += pnl;

      if (String(trade.status).toLowerCase() === 'open') {
        openTrades += 1;
      } else {
        closedTrades += 1;
      }

      if (pnl > 0) {
        wins += 1;
        totalWin += pnl;
      } else if (pnl < 0) {
        losses += 1;
        totalLossAbs += Math.abs(pnl);
      } else {
        breakeven += 1;
      }

      if (trade.rMultiple !== null && trade.rMultiple !== undefined) {
        totalRMultiple += this.toNumber(trade.rMultiple);
        rMultipleCount += 1;
      }

      if (trade.followedPlan !== null && trade.followedPlan !== undefined) {
        followedPlanTracked += 1;
        if (trade.followedPlan) {
          followedPlanYes += 1;
        }
      }

      const symbol = trade.symbol || 'UNKNOWN';
      const symbolEntry = symbolStats.get(symbol) || {
        count: 0,
        netPnL: 0,
        wins: 0,
        losses: 0,
      };
      symbolEntry.count += 1;
      symbolEntry.netPnL += pnl;
      if (pnl > 0) symbolEntry.wins += 1;
      if (pnl < 0) symbolEntry.losses += 1;
      symbolStats.set(symbol, symbolEntry);

      const mappedAccount = trade.accountId
        ? accountNameById.get(trade.accountId) || trade.accountId
        : 'Unassigned';
      const accountEntry = accountStats.get(mappedAccount) || {
        count: 0,
        netPnL: 0,
      };
      accountEntry.count += 1;
      accountEntry.netPnL += pnl;
      accountStats.set(mappedAccount, accountEntry);

      if (trade.session) {
        const sessionEntry = sessionStats.get(trade.session) || {
          count: 0,
          netPnL: 0,
        };
        sessionEntry.count += 1;
        sessionEntry.netPnL += pnl;
        sessionStats.set(trade.session, sessionEntry);
      }

      const emotions = [trade.emotionBefore, trade.emotionDuring, trade.emotionAfter]
        .filter(Boolean)
        .map((emotion) => String(emotion));
      for (const emotion of emotions) {
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
      }

      if (Array.isArray(trade.ruleViolations)) {
        totalRuleViolations += trade.ruleViolations.length;
      }
    }

    const topSymbols = Array.from(symbolStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([symbol, stats]) => ({
        symbol,
        trades: stats.count,
        netPnL: Number(stats.netPnL.toFixed(2)),
        winRate:
          stats.wins + stats.losses > 0
            ? Number(
                ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(2),
              )
            : 0,
      }));

    const accountBreakdown = Array.from(accountStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([account, stats]) => ({
        account,
        trades: stats.count,
        netPnL: Number(stats.netPnL.toFixed(2)),
      }));

    const topEmotions = Array.from(emotionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([emotion, count]) => ({ emotion, count }));

    const sessions = Array.from(sessionStats.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([session, stats]) => ({
        session,
        trades: stats.count,
        netPnL: Number(stats.netPnL.toFixed(2)),
      }));

    const winRate =
      wins + losses > 0 ? Number(((wins / (wins + losses)) * 100).toFixed(2)) : 0;
    const avgWin = wins > 0 ? Number((totalWin / wins).toFixed(2)) : 0;
    const avgLoss = losses > 0 ? Number((totalLossAbs / losses).toFixed(2)) : 0;
    const expectancy =
      wins + losses > 0
        ? Number(
            (
              (wins / (wins + losses)) * avgWin -
              (losses / (wins + losses)) * avgLoss
            ).toFixed(2),
          )
        : 0;

    return {
      scope: scopedAccountId || 'all-accounts',
      totalTrades: trades.length,
      closedTrades,
      openTrades,
      wins,
      losses,
      breakeven,
      winRate,
      netPnL: Number(netPnL.toFixed(2)),
      avgWin,
      avgLoss,
      expectancy,
      averageRMultiple:
        rMultipleCount > 0
          ? Number((totalRMultiple / rMultipleCount).toFixed(3))
          : 0,
      followedPlanRate:
        followedPlanTracked > 0
          ? Number(((followedPlanYes / followedPlanTracked) * 100).toFixed(2))
          : null,
      totalRuleViolations,
      topSymbols,
      accountBreakdown,
      topEmotions,
      sessions,
    };
  }

  private serializeTrade(
    trade: Trade,
    accountNameById: Map<string, string>,
  ): Record<string, unknown> {
    const raw = trade as unknown as Record<string, unknown>;
    const record: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (value === undefined || key === 'user' || key === 'strategy') {
        continue;
      }
      if (value instanceof Date) {
        record[key] = value.toISOString();
      } else if (Array.isArray(value) && key === 'tags') {
        record.tags = value
          .map((tag) => {
            if (tag && typeof tag === 'object' && 'name' in tag) {
              return String((tag as { name?: string }).name || '');
            }
            return String(tag);
          })
          .filter((tag) => tag.length > 0);
      } else {
        record[key] = value;
      }
    }

    record.accountName =
      (trade.accountId && accountNameById.get(trade.accountId)) || null;
    return record;
  }
}
