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

type CoachSeverity = 'high' | 'medium' | 'low';

type CoachDiagnosisItem = {
  title: string;
  severity: CoachSeverity;
  finding: string;
  impact: string;
  action: string;
  evidenceRefs: string[];
};

type CoachPatternItem = {
  pattern: string;
  whyItMatters: string;
  trigger: string;
  intervention: string;
  evidenceRefs: string[];
};

type CoachPlanStep = {
  step: string;
  objective: string;
  checklist: string[];
  whenToApply: string;
};

type CoachRiskAlert = {
  title: string;
  level: CoachSeverity;
  description: string;
  mitigation: string;
};

type CoachMetric = {
  label: string;
  value: string;
  context?: string;
};

type CoachEvidenceItem = {
  evidenceId: string;
  tradeId: string;
  symbol: string;
  openTime: string;
  pnl: number;
  rMultiple: number;
  ruleViolations: number;
  emotionBefore?: string | null;
  emotionAfter?: string | null;
  accountName?: string | null;
  note: string;
};

type CoachResponseV2 = {
  headline: string;
  diagnosis: CoachDiagnosisItem[];
  performance: {
    overview: string;
    keyMetrics: CoachMetric[];
  };
  psychologyPatterns: CoachPatternItem[];
  next5TradesPlan: CoachPlanStep[];
  riskAlerts: CoachRiskAlert[];
  evidence: CoachEvidenceItem[];
  confidence: number;
  missingData: string[];
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
    const detailedLimit = 140;
    const detailedRecords = trades
      .slice(0, detailedLimit)
      .map((trade) => this.serializeTrade(trade, accountNameById));
    const evidence = this.buildCoachEvidence(trades, accountNameById, 12);

    const historyBlock = history
      .slice(-8)
      .map((item, idx) => `${idx + 1}. ${item.role.toUpperCase()}: ${item.content}`)
      .join('\n');

    const prompt = `
You are "TradeTaper Coach" — an elite trader coach + trading psychologist.
Your output MUST be strict JSON and MUST match the required schema exactly.

Core rules:
- Never fabricate numbers, fields, trade IDs, or evidence refs.
- Every major claim must reference evidence IDs from the provided evidence list.
- Keep recommendations actionable and specific to this user.
- Educational coaching only (not investment advice).

Conversation history:
${historyBlock || 'No prior messages.'}

User question:
${question}

Scope:
${accountId ? `Single account (${accountId})` : 'All accounts'}

Analytics summary (computed):
${JSON.stringify(summary)}

Top evidence trades:
${JSON.stringify(evidence)}

Recent trade records (latest ${detailedLimit}):
${JSON.stringify(detailedRecords)}

Response behavior:
- Provide 2-4 diagnosis items.
- Provide 2-4 psychology patterns.
- Provide exactly 5 next-trade plan steps.
- Provide 2-4 risk alerts.
- Use key metrics grounded in analytics summary.
- confidence should be 0-100.
`;

    let structured = this.buildFallbackCoachResponse(
      summary,
      evidence,
      question,
      accountId,
    );

    try {
      const llmResponse = await this.llm.complete({
        prompt,
        modelPreference: 'gemini-3-flash-preview',
        taskComplexity: 'complex',
        optimizeFor: 'quality',
        maxTokens: 2600,
        userId,
        requireJson: true,
        responseJsonSchema: this.getCoachResponseSchema(),
      });

      const parsed = this.extractJsonObject(llmResponse.content);
      if (parsed) {
        structured = this.normalizeCoachResponse(
          parsed,
          summary,
          evidence,
          question,
        );
      }
    } catch {
      // Fall back to deterministic response below.
    }

    const answer = this.formatCoachResponseAsMarkdown(structured);

    return {
      success: true,
      data: {
        answer,
        structured,
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

  private getCoachResponseSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        diagnosis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              finding: { type: 'string' },
              impact: { type: 'string' },
              action: { type: 'string' },
              evidenceRefs: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'title',
              'severity',
              'finding',
              'impact',
              'action',
              'evidenceRefs',
            ],
          },
        },
        performance: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            keyMetrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                  context: { type: 'string' },
                },
                required: ['label', 'value'],
              },
            },
          },
          required: ['overview', 'keyMetrics'],
        },
        psychologyPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              whyItMatters: { type: 'string' },
              trigger: { type: 'string' },
              intervention: { type: 'string' },
              evidenceRefs: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: [
              'pattern',
              'whyItMatters',
              'trigger',
              'intervention',
              'evidenceRefs',
            ],
          },
        },
        next5TradesPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              objective: { type: 'string' },
              checklist: {
                type: 'array',
                items: { type: 'string' },
              },
              whenToApply: { type: 'string' },
            },
            required: ['step', 'objective', 'checklist', 'whenToApply'],
          },
        },
        riskAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              level: { type: 'string', enum: ['high', 'medium', 'low'] },
              description: { type: 'string' },
              mitigation: { type: 'string' },
            },
            required: ['title', 'level', 'description', 'mitigation'],
          },
        },
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              evidenceId: { type: 'string' },
              tradeId: { type: 'string' },
              symbol: { type: 'string' },
              openTime: { type: 'string' },
              pnl: { type: 'number' },
              rMultiple: { type: 'number' },
              ruleViolations: { type: 'number' },
              emotionBefore: { type: 'string' },
              emotionAfter: { type: 'string' },
              accountName: { type: 'string' },
              note: { type: 'string' },
            },
            required: [
              'evidenceId',
              'tradeId',
              'symbol',
              'openTime',
              'pnl',
              'rMultiple',
              'ruleViolations',
              'note',
            ],
          },
        },
        confidence: { type: 'number' },
        missingData: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: [
        'headline',
        'diagnosis',
        'performance',
        'psychologyPatterns',
        'next5TradesPlan',
        'riskAlerts',
        'evidence',
        'confidence',
        'missingData',
      ],
    };
  }

  private extractJsonObject(raw: string): Record<string, unknown> | null {
    const cleaned = String(raw || '')
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    if (!cleaned) return null;

    try {
      const parsed = JSON.parse(cleaned);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          const sliced = cleaned.slice(start, end + 1);
          const parsed = JSON.parse(sliced);
          return typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, unknown>)
            : null;
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private normalizeCoachResponse(
    payload: Record<string, unknown>,
    summary: Record<string, unknown>,
    sourceEvidence: CoachEvidenceItem[],
    question: string,
  ): CoachResponseV2 {
    const fallback = this.buildFallbackCoachResponse(
      summary,
      sourceEvidence,
      question,
      typeof summary.scope === 'string' ? summary.scope : undefined,
    );

    const asObject = (value: unknown): Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};

    const asArray = (value: unknown): unknown[] =>
      Array.isArray(value) ? value : [];

    const asString = (value: unknown, fallbackValue = ''): string => {
      const text = String(value ?? '').trim();
      return text.length > 0 ? text : fallbackValue;
    };

    const asSeverity = (value: unknown, fallbackValue: CoachSeverity): CoachSeverity => {
      const normalized = String(value || '')
        .trim()
        .toLowerCase();
      return normalized === 'high' || normalized === 'medium' || normalized === 'low'
        ? normalized
        : fallbackValue;
    };

    const asStringArray = (value: unknown, max = 6): string[] =>
      asArray(value)
        .map((entry) => asString(entry))
        .filter((entry) => entry.length > 0)
        .slice(0, max);

    const evidenceById = new Map(sourceEvidence.map((item) => [item.evidenceId, item]));
    const allowedEvidenceIds = new Set(sourceEvidence.map((item) => item.evidenceId));

    const normalizedEvidence = asArray(payload.evidence)
      .map((entry) => {
        const obj = asObject(entry);
        const evidenceId = asString(obj.evidenceId);
        const matched = evidenceById.get(evidenceId);
        if (!matched) return null;
        return {
          ...matched,
          note: asString(obj.note, matched.note),
        } as CoachEvidenceItem;
      })
      .filter((entry): entry is CoachEvidenceItem => entry !== null);

    const diagnosis = asArray(payload.diagnosis)
      .map((entry) => asObject(entry))
      .map((entry) => ({
        title: asString(entry.title),
        severity: asSeverity(entry.severity, 'medium'),
        finding: asString(entry.finding),
        impact: asString(entry.impact),
        action: asString(entry.action),
        evidenceRefs: asStringArray(entry.evidenceRefs, 4).filter((ref) =>
          allowedEvidenceIds.has(ref),
        ),
      }))
      .filter((entry) => entry.title && entry.finding && entry.action);

    const patterns = asArray(payload.psychologyPatterns)
      .map((entry) => asObject(entry))
      .map((entry) => ({
        pattern: asString(entry.pattern),
        whyItMatters: asString(entry.whyItMatters),
        trigger: asString(entry.trigger),
        intervention: asString(entry.intervention),
        evidenceRefs: asStringArray(entry.evidenceRefs, 3).filter((ref) =>
          allowedEvidenceIds.has(ref),
        ),
      }))
      .filter((entry) => entry.pattern && entry.intervention);

    const plan = asArray(payload.next5TradesPlan)
      .map((entry) => asObject(entry))
      .map((entry) => ({
        step: asString(entry.step),
        objective: asString(entry.objective),
        checklist: asStringArray(entry.checklist, 5),
        whenToApply: asString(entry.whenToApply),
      }))
      .filter((entry) => entry.step && entry.objective);

    const riskAlerts = asArray(payload.riskAlerts)
      .map((entry) => asObject(entry))
      .map((entry) => ({
        title: asString(entry.title),
        level: asSeverity(entry.level, 'medium'),
        description: asString(entry.description),
        mitigation: asString(entry.mitigation),
      }))
      .filter((entry) => entry.title && entry.description && entry.mitigation);

    const perf = asObject(payload.performance);
    const keyMetrics = asArray(perf.keyMetrics)
      .map((entry) => asObject(entry))
      .map((entry) => ({
        label: asString(entry.label),
        value: asString(entry.value),
        context: asString(entry.context),
      }))
      .filter((entry) => entry.label && entry.value);

    const confidenceRaw = this.toNumber(payload.confidence);
    const confidence = Math.max(0, Math.min(100, confidenceRaw || fallback.confidence));

    const normalized: CoachResponseV2 = {
      headline: asString(payload.headline, fallback.headline),
      diagnosis: diagnosis.length > 0 ? diagnosis.slice(0, 4) : fallback.diagnosis,
      performance: {
        overview: asString(perf.overview, fallback.performance.overview),
        keyMetrics:
          keyMetrics.length > 0 ? keyMetrics.slice(0, 8) : fallback.performance.keyMetrics,
      },
      psychologyPatterns:
        patterns.length > 0 ? patterns.slice(0, 4) : fallback.psychologyPatterns,
      next5TradesPlan:
        plan.length >= 5 ? plan.slice(0, 5) : fallback.next5TradesPlan,
      riskAlerts: riskAlerts.length > 0 ? riskAlerts.slice(0, 4) : fallback.riskAlerts,
      evidence:
        normalizedEvidence.length > 0
          ? normalizedEvidence.slice(0, 12)
          : fallback.evidence,
      confidence,
      missingData: asStringArray(payload.missingData, 8),
    };

    if (normalized.missingData.length === 0) {
      normalized.missingData = fallback.missingData;
    }

    for (const section of normalized.diagnosis) {
      if (section.evidenceRefs.length === 0 && normalized.evidence.length > 0) {
        section.evidenceRefs = [normalized.evidence[0].evidenceId];
      }
    }

    for (const section of normalized.psychologyPatterns) {
      if (section.evidenceRefs.length === 0 && normalized.evidence.length > 0) {
        section.evidenceRefs = [normalized.evidence[0].evidenceId];
      }
    }

    return normalized;
  }

  private buildFallbackCoachResponse(
    summary: Record<string, unknown>,
    evidence: CoachEvidenceItem[],
    question: string,
    accountId?: string,
  ): CoachResponseV2 {
    const totalTrades = this.toNumber(summary.totalTrades);
    const winRate = this.toNumber(summary.winRate);
    const netPnL = this.toNumber(summary.netPnL);
    const expectancy = this.toNumber(summary.expectancy);
    const avgR = this.toNumber(summary.averageRMultiple);
    const followedPlanRate =
      summary.followedPlanRate === null || summary.followedPlanRate === undefined
        ? null
        : this.toNumber(summary.followedPlanRate);
    const totalRuleViolations = this.toNumber(summary.totalRuleViolations);
    const closedTrades = this.toNumber(summary.closedTrades);
    const losses = this.toNumber(summary.losses);

    const missingData: string[] = [];
    if (closedTrades === 0) {
      missingData.push('No closed trades yet for quantitative behavior diagnostics.');
    }
    if (followedPlanRate === null) {
      missingData.push('followedPlan field is sparsely populated.');
    }
    if (this.toNumber(summary.averageRMultiple) === 0) {
      missingData.push('R-multiple data is limited or not consistently captured.');
    }

    const primaryEvidence = evidence.slice(0, 3).map((item) => item.evidenceId);
    const fallbackEvidenceRef =
      primaryEvidence.length > 0 ? primaryEvidence : ['E1'];

    const diagnosis: CoachDiagnosisItem[] = [
      {
        title: netPnL >= 0 ? 'Positive edge but fragile discipline' : 'Negative expectancy drift',
        severity: netPnL >= 0 ? 'medium' : 'high',
        finding:
          netPnL >= 0
            ? `Net PnL is positive (${netPnL.toFixed(2)}), but execution quality can regress if rules are loose.`
            : `Net PnL is negative (${netPnL.toFixed(2)}), indicating execution and risk control need immediate tightening.`,
        impact:
          netPnL >= 0
            ? 'A few impulsive sessions can erase current gains.'
            : 'Continuation of current behavior can compound drawdown.',
        action:
          'Cap per-trade risk, enforce checklist confirmation before entry, and review all outlier losses daily.',
        evidenceRefs: fallbackEvidenceRef,
      },
      {
        title: 'Consistency profile',
        severity: winRate >= 50 ? 'low' : 'medium',
        finding: `Win rate is ${winRate.toFixed(2)}% across ${closedTrades.toFixed(0)} closed trades.`,
        impact:
          winRate >= 50
            ? 'Edge exists but must be protected through process consistency.'
            : 'Sub-50% win rate requires stronger R-multiple quality and tighter loss control.',
        action:
          'Focus on setup quality over frequency and eliminate low-conviction entries.',
        evidenceRefs: fallbackEvidenceRef,
      },
    ];

    const performanceMetrics: CoachMetric[] = [
      { label: 'Total Trades', value: totalTrades.toFixed(0) },
      { label: 'Closed Trades', value: closedTrades.toFixed(0) },
      { label: 'Win Rate', value: `${winRate.toFixed(2)}%` },
      { label: 'Net PnL', value: netPnL.toFixed(2) },
      { label: 'Expectancy', value: expectancy.toFixed(2) },
      { label: 'Avg R-Multiple', value: avgR.toFixed(3) },
      {
        label: 'Rule Violations',
        value: totalRuleViolations.toFixed(0),
        context: `Losses: ${losses.toFixed(0)}`,
      },
    ];

    if (followedPlanRate !== null) {
      performanceMetrics.push({
        label: 'Followed Plan Rate',
        value: `${followedPlanRate.toFixed(2)}%`,
      });
    }

    return {
      headline:
        netPnL >= 0
          ? `You are profitable, but your next growth step is stricter execution quality${accountId ? ` on ${accountId}` : ''}.`
          : `You need an immediate execution reset${accountId ? ` on ${accountId}` : ''} to stop negative drift.`,
      diagnosis,
      performance: {
        overview:
          question.length > 0
            ? `Answering your question: "${question}". The key is to translate current stats into repeatable process behavior.`
            : 'Performance is assessed from your recent trade history and behavior markers.',
        keyMetrics: performanceMetrics,
      },
      psychologyPatterns: [
        {
          pattern: 'Outcome-driven decision shifts',
          whyItMatters:
            'Recent winners or losers can bias the next setup and distort your position sizing.',
          trigger: 'Back-to-back wins or losses in a short window.',
          intervention:
            'Pause for 2 minutes and confirm setup checklist + risk cap before the next trade.',
          evidenceRefs: fallbackEvidenceRef,
        },
        {
          pattern: 'Rule discipline variance',
          whyItMatters:
            'Inconsistent rule-following increases downside tails and weakens statistical edge.',
          trigger: 'Entering without full confirmation stack.',
          intervention:
            'Require explicit pre-entry confirmation and journal one sentence for entry reason.',
          evidenceRefs: fallbackEvidenceRef,
        },
      ],
      next5TradesPlan: [
        {
          step: 'Trade 1',
          objective: 'Quality gate reset',
          checklist: ['Checklist complete', 'Risk capped', 'Entry reason documented'],
          whenToApply: 'Before opening the next position.',
        },
        {
          step: 'Trade 2',
          objective: 'Execution consistency',
          checklist: ['No impulsive scaling', 'Stop/target locked', 'No mid-trade over-management'],
          whenToApply: 'During trade management.',
        },
        {
          step: 'Trade 3',
          objective: 'Behavior checkpoint',
          checklist: ['Emotion before entry logged', 'Followed plan marked yes/no', 'Post-trade mistake noted'],
          whenToApply: 'Immediately after close.',
        },
        {
          step: 'Trade 4',
          objective: 'Risk normalization',
          checklist: ['Same risk % as plan', 'No revenge setup', 'Session quality validated'],
          whenToApply: 'Before entry and after close.',
        },
        {
          step: 'Trade 5',
          objective: 'Review and reinforce',
          checklist: ['Summarize 3 strengths', 'Summarize 3 leaks', 'Set one rule for next week'],
          whenToApply: 'End of fifth trade.',
        },
      ],
      riskAlerts: [
        {
          title: 'Process drift risk',
          level: losses > 0 ? 'high' : 'medium',
          description:
            'If setup quality standards are relaxed, variance can dominate your results quickly.',
          mitigation:
            'Use a hard checklist gate and skip trades that miss confirmations.',
        },
        {
          title: 'Behavior compounding risk',
          level: totalRuleViolations > 0 ? 'high' : 'low',
          description:
            'Rule violations can compound faster than gains when position sizing is not constrained.',
          mitigation:
            'Use fixed risk sizing and a daily max-violation cutoff.',
        },
      ],
      evidence: evidence.slice(0, 12),
      confidence: closedTrades > 15 ? 82 : closedTrades > 0 ? 68 : 45,
      missingData,
    };
  }

  private buildCoachEvidence(
    trades: Trade[],
    accountNameById: Map<string, string>,
    limit = 12,
  ): CoachEvidenceItem[] {
    const scored = trades
      .map((trade) => {
        const pnl = this.toNumber(trade.profitOrLoss);
        const rMultiple = this.toNumber(trade.rMultiple);
        const ruleViolations = Array.isArray(trade.ruleViolations)
          ? trade.ruleViolations.length
          : 0;
        const score =
          Math.abs(pnl) +
          Math.abs(rMultiple) * 120 +
          ruleViolations * 180 +
          (trade.followedPlan === false ? 120 : 0);

        return {
          trade,
          pnl,
          rMultiple,
          ruleViolations,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((item, idx) => {
      const openTime =
        item.trade.openTime instanceof Date
          ? item.trade.openTime.toISOString()
          : String(item.trade.openTime || '');
      const accountName =
        (item.trade.accountId && accountNameById.get(item.trade.accountId)) || null;

      const noteParts: string[] = [];
      if (item.pnl >= 0) {
        noteParts.push(`Large winner (${item.pnl.toFixed(2)})`);
      } else {
        noteParts.push(`Large loss (${item.pnl.toFixed(2)})`);
      }
      if (item.ruleViolations > 0) {
        noteParts.push(`${item.ruleViolations} rule violation(s)`);
      }
      if (item.trade.followedPlan === false) {
        noteParts.push('Plan not followed');
      }

      return {
        evidenceId: `E${idx + 1}`,
        tradeId: item.trade.id,
        symbol: item.trade.symbol || 'UNKNOWN',
        openTime,
        pnl: Number(item.pnl.toFixed(2)),
        rMultiple: Number(item.rMultiple.toFixed(3)),
        ruleViolations: item.ruleViolations,
        emotionBefore: item.trade.emotionBefore ? String(item.trade.emotionBefore) : null,
        emotionAfter: item.trade.emotionAfter ? String(item.trade.emotionAfter) : null,
        accountName,
        note: noteParts.join(' | ') || 'Representative trade sample',
      };
    });
  }

  private formatCoachResponseAsMarkdown(response: CoachResponseV2): string {
    const formatEvidence = (refs: string[]): string =>
      refs.length > 0 ? ` (${refs.join(', ')})` : '';

    const diagnosisBlock = response.diagnosis
      .map(
        (item) =>
          `- **${item.title}** [${item.severity.toUpperCase()}]${formatEvidence(item.evidenceRefs)}\n  - Finding: ${item.finding}\n  - Impact: ${item.impact}\n  - Action: ${item.action}`,
      )
      .join('\n');

    const metricsBlock = response.performance.keyMetrics
      .map(
        (metric) =>
          `- **${metric.label}:** ${metric.value}${metric.context ? ` (${metric.context})` : ''}`,
      )
      .join('\n');

    const patternsBlock = response.psychologyPatterns
      .map(
        (item) =>
          `- **${item.pattern}**${formatEvidence(item.evidenceRefs)}\n  - Trigger: ${item.trigger}\n  - Why it matters: ${item.whyItMatters}\n  - Intervention: ${item.intervention}`,
      )
      .join('\n');

    const planBlock = response.next5TradesPlan
      .map(
        (item, idx) =>
          `${idx + 1}. **${item.step} — ${item.objective}**\n   - Apply: ${item.whenToApply}\n   - Checklist: ${item.checklist.join(', ')}`,
      )
      .join('\n');

    const alertsBlock = response.riskAlerts
      .map(
        (item) =>
          `- **${item.title}** [${item.level.toUpperCase()}]\n  - ${item.description}\n  - Mitigation: ${item.mitigation}`,
      )
      .join('\n');

    const evidenceBlock = response.evidence
      .slice(0, 6)
      .map(
        (item) =>
          `- **${item.evidenceId}** ${item.symbol} | PnL ${item.pnl.toFixed(2)} | R ${item.rMultiple.toFixed(3)} | ${item.note}`,
      )
      .join('\n');

    const missingDataBlock =
      response.missingData.length > 0
        ? response.missingData.map((item) => `- ${item}`).join('\n')
        : '- None';

    return `## Immediate Diagnosis
${response.headline}

${diagnosisBlock || '- No diagnosis available.'}

## Performance Breakdown
${response.performance.overview}

${metricsBlock || '- No metrics available.'}

## Psychology & Discipline Patterns
${patternsBlock || '- No behavior patterns identified yet.'}

## Next 5 Trades Plan
${planBlock || '1. No plan generated.'}

## Risk Warnings
${alertsBlock || '- No risk alerts generated.'}

## Evidence
${evidenceBlock || '- No evidence records available.'}

## Data Gaps
${missingDataBlock}

**Coach confidence:** ${response.confidence.toFixed(0)}%`;
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
