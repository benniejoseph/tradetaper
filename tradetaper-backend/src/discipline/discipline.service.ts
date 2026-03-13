import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  TradeApproval,
  ApprovalStatus,
} from './entities/trade-approval.entity';
import {
  TraderDiscipline,
  Badge,
} from './entities/trader-discipline.entity';
import {
  CooldownSession,
  CooldownTrigger,
} from './entities/cooldown-session.entity';
import {
  CreateApprovalDto,
  ApproveTradeDto,
  CreateIfThenPlanDto,
  UpdateIfThenPlanDto,
} from './dto/discipline.dto';
import { TerminalFarmService } from '../terminal-farm/terminal-farm.service';
import { Trade } from '../trades/entities/trade.entity';
import { EmotionalState, TradeStatus } from '../types/enums';
import { IfThenPlan, IfThenTriggerType } from './entities/if-then-plan.entity';

export interface DisciplineBehaviorTrigger {
  type:
    | 'loss_streak'
    | 'overtrading'
    | 'revenge_trade'
    | 'unauthorized_trade'
    | 'performance_dip';
  severity: 'low' | 'medium' | 'high';
  title: string;
  detail: string;
  suggestion: string;
}

export interface DisciplineMatchedPlan {
  id: string;
  accountId?: string | null;
  triggerType: IfThenTriggerType;
  ifCue: string;
  thenAction: string;
}

export interface DisciplineBehaviorSignals {
  generatedAt: string;
  accountId?: string;
  riskScore: number;
  cooldownActive: boolean;
  metrics: {
    closedTradesSampled: number;
    lossStreak: number;
    tradesLast2Hours: number;
    recentAveragePnl: number;
    violationRate: number;
    emotionalPressure: number;
  };
  triggers: DisciplineBehaviorTrigger[];
  matchedPlans: DisciplineMatchedPlan[];
}

// XP rewards configuration
const XP_REWARDS = {
  CHECKLIST_COMPLETE: 10,
  TRADE_EXECUTED: 25,
  WINNING_TRADE: 50,
  STREAK_DAILY: 20,
  BRAIN_TRAINING: 30,
  PERFECT_WEEK: 200,
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1800, 2500, 3500, 5000, 7000, 10000, 15000,
  22000, 30000,
];

// Badge definitions
const BADGES = {
  FIRST_BLOOD: {
    id: 'first_blood',
    name: 'First Blood',
    icon: '🏆',
    description: 'First approved trade',
  },
  ON_FIRE: {
    id: 'on_fire',
    name: 'On Fire',
    icon: '🔥',
    description: '10 trade streak',
  },
  ZEN_MASTER: {
    id: 'zen_master',
    name: 'Zen Master',
    icon: '🧘',
    description: 'Complete 10 cooldown sessions',
  },
  CAPITAL_GUARDIAN: {
    id: 'capital_guardian',
    name: 'Capital Guardian',
    icon: '🛡️',
    description: '30 days without 1%+ loss',
  },
  SPEED_DEMON: {
    id: 'speed_demon',
    name: 'Speed Demon',
    icon: '⚡',
    description: 'Execute trade within 10s of approval',
  },
  SNIPER: {
    id: 'sniper',
    name: 'Sniper',
    icon: '🎯',
    description: '5 trades with 3R+ result',
  },
};

@Injectable()
export class DisciplineService {
  constructor(
    @InjectRepository(TradeApproval)
    private approvalRepo: Repository<TradeApproval>,
    @InjectRepository(TraderDiscipline)
    private disciplineRepo: Repository<TraderDiscipline>,
    @InjectRepository(CooldownSession)
    private cooldownRepo: Repository<CooldownSession>,
    @InjectRepository(Trade)
    private tradeRepo: Repository<Trade>,
    @InjectRepository(IfThenPlan)
    private ifThenPlanRepo: Repository<IfThenPlan>,
    private terminalFarmService: TerminalFarmService,
  ) {}

  // ============== DISCIPLINE SCORE ==============

  async getOrCreateDiscipline(userId: string): Promise<TraderDiscipline> {
    let discipline = await this.disciplineRepo.findOne({ where: { userId } });
    if (!discipline) {
      discipline = this.disciplineRepo.create({ userId });
      await this.disciplineRepo.save(discipline);
    }
    return discipline;
  }

  async getDisciplineStats(
    userId: string,
    accountId?: string,
  ): Promise<TraderDiscipline> {
    const discipline = await this.getOrCreateDiscipline(userId);
    const normalizedAccountId = this.normalizeAccountScope(accountId) ?? undefined;

    const tradeQuery = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED });

    if (normalizedAccountId) {
      tradeQuery.andWhere('trade.accountId = :accountId', {
        accountId: normalizedAccountId,
      });
    }

    const [executedTradesRow, violationsRow, unauthorizedRow, latestTradeRow, tradeDateRows] =
      await Promise.all([
        tradeQuery
          .clone()
          .select('COUNT(*)', 'count')
          .getRawOne<{ count: string }>(),
        tradeQuery
          .clone()
          .andWhere(
            '(trade.followedPlan = false OR (trade.ruleViolations IS NOT NULL AND trade.ruleViolations <> \'\'))',
          )
          .select('COUNT(*)', 'count')
          .getRawOne<{ count: string }>(),
        tradeQuery
          .clone()
          .andWhere('trade.followedPlan = false')
          .select('COUNT(*)', 'count')
          .getRawOne<{ count: string }>(),
        tradeQuery
          .clone()
          .select('MAX(COALESCE(trade.closeTime, trade.openTime))', 'lastTradeAt')
          .getRawOne<{ lastTradeAt: string | null }>(),
        tradeQuery
          .clone()
          .select("DATE(timezone('UTC', COALESCE(trade.closeTime, trade.openTime)))", 'tradeDate')
          .groupBy('tradeDate')
          .orderBy('tradeDate', 'DESC')
          .getRawMany<{ tradeDate: string | null }>(),
      ]);

    const totalExecutedTrades = Number(executedTradesRow?.count) || 0;
    const totalRuleViolations = Number(violationsRow?.count) || 0;
    const totalUnauthorizedTrades = Number(unauthorizedRow?.count) || 0;
    const computedScore = this.calculateDisciplineScoreFromTrades(
      totalExecutedTrades,
      totalRuleViolations,
      totalUnauthorizedTrades,
      Number(discipline.disciplineScore) || 100,
    );

    const { currentStreak, longestStreak } = this.calculateTradingStreaks(
      tradeDateRows
        .map((row) => row.tradeDate)
        .filter((value): value is string => Boolean(value)),
    );

    return {
      ...discipline,
      totalExecutedTrades,
      totalRuleViolations,
      totalUnauthorizedTrades,
      disciplineScore: computedScore,
      currentStreak,
      longestStreak: Math.max(Number(discipline.longestStreak) || 0, longestStreak),
      lastTradeAt: latestTradeRow?.lastTradeAt
        ? new Date(latestTradeRow.lastTradeAt)
        : discipline.lastTradeAt,
    };
  }

  private normalizeAccountScope(accountId?: string): string | null {
    if (accountId === undefined) return null;
    const normalized = accountId.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private calculateDisciplineScoreFromTrades(
    totalExecutedTrades: number,
    totalRuleViolations: number,
    totalUnauthorizedTrades: number,
    fallbackScore: number,
  ): number {
    if (totalExecutedTrades <= 0) {
      return Math.max(0, Math.min(100, fallbackScore));
    }

    const violationRate = totalRuleViolations / totalExecutedTrades;
    const unauthorizedRate = totalUnauthorizedTrades / totalExecutedTrades;

    let score = 100;
    score -= violationRate * 45;
    score -= unauthorizedRate * 35;

    if (totalRuleViolations === 0) {
      score += 3;
    }
    if (totalUnauthorizedTrades === 0) {
      score += 2;
    }

    return Math.max(0, Math.min(100, Number(score.toFixed(2))));
  }

  private calculateTradingStreaks(tradeDates: string[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (!tradeDates.length) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    const uniqueDayNumbers = Array.from(
      new Set(
        tradeDates.map((value) => {
          const date = new Date(`${value}T00:00:00.000Z`);
          return Math.floor(date.getTime() / 86400000);
        }),
      ),
    ).sort((a, b) => b - a);

    if (uniqueDayNumbers.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let longestStreak = 1;
    let runningStreak = 1;

    for (let i = 1; i < uniqueDayNumbers.length; i += 1) {
      const previous = uniqueDayNumbers[i - 1];
      const current = uniqueDayNumbers[i];
      if (previous - current === 1) {
        runningStreak += 1;
        longestStreak = Math.max(longestStreak, runningStreak);
      } else {
        runningStreak = 1;
      }
    }

    const todayDayNumber = Math.floor(Date.now() / 86400000);
    const latestTradeDay = uniqueDayNumbers[0];
    if (latestTradeDay < todayDayNumber - 1) {
      return { currentStreak: 0, longestStreak };
    }

    let currentStreak = 1;
    for (let i = 1; i < uniqueDayNumbers.length; i += 1) {
      const previous = uniqueDayNumbers[i - 1];
      const current = uniqueDayNumbers[i];
      if (previous - current === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    return { currentStreak, longestStreak };
  }

  private normalizeRequiredText(
    value: string,
    fieldName: 'ifCue' | 'thenAction',
  ): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(`${fieldName} cannot be empty`);
    }
    return normalized;
  }

  async getIfThenPlans(userId: string, accountId?: string): Promise<IfThenPlan[]> {
    const normalizedAccountId = this.normalizeAccountScope(accountId);

    const query = this.ifThenPlanRepo
      .createQueryBuilder('plan')
      .where('plan.userId = :userId', { userId })
      .orderBy('plan.isActive', 'DESC')
      .addOrderBy('plan.createdAt', 'DESC');

    if (normalizedAccountId) {
      query.andWhere('(plan.accountId = :accountId OR plan.accountId IS NULL)', {
        accountId: normalizedAccountId,
      });
    }

    return query.getMany();
  }

  async createIfThenPlan(
    userId: string,
    dto: CreateIfThenPlanDto,
  ): Promise<IfThenPlan> {
    const plan = this.ifThenPlanRepo.create({
      userId,
      accountId: this.normalizeAccountScope(dto.accountId),
      triggerType: dto.triggerType ?? IfThenTriggerType.CUSTOM,
      ifCue: this.normalizeRequiredText(dto.ifCue, 'ifCue'),
      thenAction: this.normalizeRequiredText(dto.thenAction, 'thenAction'),
      isActive: dto.isActive ?? true,
    });

    return this.ifThenPlanRepo.save(plan);
  }

  async updateIfThenPlan(
    userId: string,
    planId: string,
    dto: UpdateIfThenPlanDto,
  ): Promise<IfThenPlan> {
    const plan = await this.ifThenPlanRepo.findOne({
      where: { id: planId, userId },
    });
    if (!plan) {
      throw new NotFoundException('If-Then plan not found');
    }

    if (dto.ifCue !== undefined) {
      plan.ifCue = this.normalizeRequiredText(dto.ifCue, 'ifCue');
    }
    if (dto.thenAction !== undefined) {
      plan.thenAction = this.normalizeRequiredText(dto.thenAction, 'thenAction');
    }
    if (dto.accountId !== undefined) {
      plan.accountId = this.normalizeAccountScope(dto.accountId);
    }
    if (dto.triggerType !== undefined) {
      plan.triggerType = dto.triggerType;
    }
    if (dto.isActive !== undefined) {
      plan.isActive = dto.isActive;
    }

    return this.ifThenPlanRepo.save(plan);
  }

  async deleteIfThenPlan(
    userId: string,
    planId: string,
  ): Promise<{ deleted: boolean }> {
    const result = await this.ifThenPlanRepo.delete({ id: planId, userId });
    if (!result.affected) {
      throw new NotFoundException('If-Then plan not found');
    }

    return { deleted: true };
  }

  private coercePnl(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getViolationCount(trades: Trade[]): number {
    return trades.filter(
      (trade) =>
        trade.followedPlan === false ||
        (Array.isArray(trade.ruleViolations) && trade.ruleViolations.length > 0),
    ).length;
  }

  private getEmotionalPressure(trades: Trade[]): number {
    const pressureStates = new Set<EmotionalState>([
      EmotionalState.FOMO,
      EmotionalState.REVENGE,
      EmotionalState.FRUSTRATED,
      EmotionalState.OVERCONFIDENT,
      EmotionalState.IMPATIENT,
      EmotionalState.ANXIOUS,
      EmotionalState.FEARFUL,
      EmotionalState.RUSHED,
      EmotionalState.OVERWHELMED,
    ]);

    return trades.filter(
      (trade) => trade.emotionBefore && pressureStates.has(trade.emotionBefore),
    ).length;
  }

  async getBehaviorSignals(
    userId: string,
    accountId?: string,
  ): Promise<DisciplineBehaviorSignals> {
    const normalizedAccountId = this.normalizeAccountScope(accountId) ?? undefined;

    const query = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId })
      .andWhere('trade.status = :status', { status: TradeStatus.CLOSED });

    if (normalizedAccountId) {
      query.andWhere('trade.accountId = :accountId', {
        accountId: normalizedAccountId,
      });
    }

    const closedTrades = await query
      .orderBy('COALESCE(trade.closeTime, trade.openTime)', 'DESC')
      .take(50)
      .select([
        'trade.id',
        'trade.status',
        'trade.accountId',
        'trade.openTime',
        'trade.closeTime',
        'trade.profitOrLoss',
        'trade.ruleViolations',
        'trade.followedPlan',
        'trade.emotionBefore',
      ])
      .getMany();

    const recentWindowStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const overtradingQuery = this.tradeRepo
      .createQueryBuilder('trade')
      .where('trade.userId = :userId', { userId })
      .andWhere('trade.openTime >= :from', { from: recentWindowStart })
      .andWhere('trade.status != :cancelled', { cancelled: TradeStatus.CANCELLED });

    if (normalizedAccountId) {
      overtradingQuery.andWhere('trade.accountId = :accountId', {
        accountId: normalizedAccountId,
      });
    }

    const tradesLast2Hours = await overtradingQuery.getCount();

    let lossStreak = 0;
    for (const trade of closedTrades) {
      if (this.coercePnl(trade.profitOrLoss) < 0) {
        lossStreak += 1;
        continue;
      }
      break;
    }

    const recentThreeTrades = closedTrades.slice(0, 3);
    const recentAveragePnl =
      recentThreeTrades.length > 0
        ? recentThreeTrades.reduce(
            (sum, trade) => sum + this.coercePnl(trade.profitOrLoss),
            0,
          ) / recentThreeTrades.length
        : 0;

    const disciplineSample = closedTrades.slice(0, 20);
    const violationCount = this.getViolationCount(disciplineSample);
    const violationRate =
      disciplineSample.length > 0 ? violationCount / disciplineSample.length : 0;
    const emotionalPressure = this.getEmotionalPressure(disciplineSample);

    const triggers: DisciplineBehaviorTrigger[] = [];

    if (lossStreak >= 2) {
      triggers.push({
        type: 'loss_streak',
        severity: lossStreak >= 4 ? 'high' : 'medium',
        title: 'Loss streak risk',
        detail: `You have ${lossStreak} consecutive losing trades.`,
        suggestion:
          'Pause for 15 minutes, cut size, and trade only A+ checklist setups.',
      });
    }

    if (tradesLast2Hours >= 6) {
      triggers.push({
        type: 'overtrading',
        severity: tradesLast2Hours >= 10 ? 'high' : 'medium',
        title: 'Overtrading pressure',
        detail: `${tradesLast2Hours} trades were opened in the last 2 hours.`,
        suggestion: 'Enforce a 5-minute no-trade timer before the next entry.',
      });
    }

    if (recentAveragePnl < 0) {
      triggers.push({
        type: 'performance_dip',
        severity: recentAveragePnl < -50 ? 'medium' : 'low',
        title: 'Performance dip',
        detail: `Recent 3-trade average P&L is ${recentAveragePnl.toFixed(2)}.`,
        suggestion: 'Review your last 3 closures and validate rule adherence.',
      });
    }

    if (violationRate >= 0.35) {
      triggers.push({
        type: 'unauthorized_trade',
        severity: violationRate >= 0.6 ? 'high' : 'medium',
        title: 'Rule-break pressure',
        detail: `${Math.round(violationRate * 100)}% of recent trades include rule breaks.`,
        suggestion: 'Switch to one-setup mode until rule-break rate improves.',
      });
    }

    if (emotionalPressure >= 2 && (lossStreak >= 1 || violationRate >= 0.2)) {
      triggers.push({
        type: 'revenge_trade',
        severity: emotionalPressure >= 4 ? 'high' : 'medium',
        title: 'Emotional escalation',
        detail: `${emotionalPressure} recent trades show high-pressure emotional states.`,
        suggestion: 'Complete a breathing + journal reset before the next trade.',
      });
    }

    const plansQuery = this.ifThenPlanRepo
      .createQueryBuilder('plan')
      .where('plan.userId = :userId', { userId })
      .andWhere('plan.isActive = true');

    if (normalizedAccountId) {
      plansQuery.andWhere('(plan.accountId = :accountId OR plan.accountId IS NULL)', {
        accountId: normalizedAccountId,
      });
    }

    const activePlans = await plansQuery
      .orderBy('plan.createdAt', 'DESC')
      .getMany();

    const matchedPlans: DisciplineMatchedPlan[] = activePlans
      .filter((plan) => triggers.some((trigger) => trigger.type === plan.triggerType))
      .map((plan) => ({
        id: plan.id,
        accountId: plan.accountId,
        triggerType: plan.triggerType,
        ifCue: plan.ifCue,
        thenAction: plan.thenAction,
      }));

    const triggersWithPlanSuggestions = triggers.map((trigger) => {
      const matchedPlan = matchedPlans.find(
        (plan) => plan.triggerType === trigger.type,
      );
      if (!matchedPlan) return trigger;

      return {
        ...trigger,
        suggestion: `If-Then plan: ${matchedPlan.thenAction}`,
      };
    });

    let riskScore = 0;
    riskScore += Math.min(lossStreak * 18, 45);
    riskScore += tradesLast2Hours >= 6 ? Math.min((tradesLast2Hours - 5) * 4, 20) : 0;
    riskScore += recentAveragePnl < 0 ? Math.min(Math.abs(recentAveragePnl) / 25, 12) : 0;
    riskScore += Math.min(violationRate * 25, 18);
    riskScore += Math.min(emotionalPressure * 4, 16);
    riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

    const activeCooldown = await this.getActiveCooldown(userId);

    return {
      generatedAt: new Date().toISOString(),
      accountId: normalizedAccountId,
      riskScore,
      cooldownActive: Boolean(activeCooldown),
      metrics: {
        closedTradesSampled: closedTrades.length,
        lossStreak,
        tradesLast2Hours,
        recentAveragePnl,
        violationRate,
        emotionalPressure,
      },
      triggers: triggersWithPlanSuggestions,
      matchedPlans,
    };
  }

  async evaluateAndTriggerCooldown(
    userId: string,
    accountId?: string,
  ): Promise<CooldownSession | null> {
    const active = await this.getActiveCooldown(userId);
    if (active) {
      return null;
    }

    const signals = await this.getBehaviorSignals(userId, accountId);
    if (signals.triggers.length === 0) {
      return null;
    }

    const triggerPriority: Array<DisciplineBehaviorTrigger['type']> = [
      'unauthorized_trade',
      'revenge_trade',
      'overtrading',
      'loss_streak',
      'performance_dip',
    ];

    const selected =
      triggerPriority
        .map((type) =>
          signals.triggers.find(
            (trigger) =>
              trigger.type === type &&
              (trigger.severity === 'high' || trigger.severity === 'medium'),
          ),
        )
        .find(Boolean) ||
      signals.triggers.find((trigger) => trigger.severity === 'high');

    if (!selected) {
      return null;
    }

    const reasonByType: Record<DisciplineBehaviorTrigger['type'], CooldownTrigger> = {
      loss_streak: CooldownTrigger.LOSS_STREAK,
      overtrading: CooldownTrigger.OVERTRADING,
      revenge_trade: CooldownTrigger.REVENGE_TRADE,
      unauthorized_trade: CooldownTrigger.UNAUTHORIZED_TRADE,
      performance_dip: CooldownTrigger.MANUAL,
    };

    const baseDuration = selected.severity === 'high' ? 45 : 20;
    const cooldown = await this.triggerCooldown(
      userId,
      reasonByType[selected.type],
      baseDuration,
    );
    cooldown.notes = `Auto-triggered by discipline engine: ${selected.title}`;
    await this.cooldownRepo.save(cooldown);
    return cooldown;
  }

  async addXp(
    userId: string,
    amount: number,
    reason: string,
  ): Promise<TraderDiscipline> {
    const discipline = await this.getOrCreateDiscipline(userId);
    discipline.xpTotal += amount;

    // Check for level up
    const newLevel = this.calculateLevel(discipline.xpTotal);
    if (newLevel > discipline.level) {
      discipline.level = newLevel;
      // Could emit event for level up notification
    }

    await this.disciplineRepo.save(discipline);
    return discipline;
  }

  async updateDisciplineScore(
    userId: string,
    delta: number,
  ): Promise<TraderDiscipline> {
    const discipline = await this.getOrCreateDiscipline(userId);
    const currentScore = Number(discipline.disciplineScore) || 0;
    discipline.disciplineScore = Math.max(
      0,
      Math.min(100, currentScore + delta),
    );

    // Track violations for negative deltas
    if (delta < 0) {
      discipline.totalRuleViolations += 1;
    }

    await this.disciplineRepo.save(discipline);
    return discipline;
  }

  private calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  async updateStreak(userId: string): Promise<void> {
    const discipline = await this.getOrCreateDiscipline(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastTradeDate = discipline.lastTradeAt?.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastTradeDate === yesterdayStr) {
      // Continuing streak
      discipline.currentStreak += 1;
      if (discipline.currentStreak > discipline.longestStreak) {
        discipline.longestStreak = discipline.currentStreak;
      }
      await this.addXp(userId, XP_REWARDS.STREAK_DAILY, 'streak_bonus');
    } else if (lastTradeDate !== today) {
      // Streak broken or first trade
      discipline.currentStreak = 1;
    }

    discipline.lastTradeAt = new Date();
    await this.disciplineRepo.save(discipline);
  }

  async recordViolation(userId: string, violationType: string): Promise<void> {
    const discipline = await this.getOrCreateDiscipline(userId);
    discipline.totalRuleViolations += 1;
    discipline.lastViolationAt = new Date();

    // Reduce discipline score
    const penalty = violationType === 'unauthorized_trade' ? 10 : 5;
    discipline.disciplineScore = Math.max(
      0,
      Number(discipline.disciplineScore) - penalty,
    );

    if (violationType === 'unauthorized_trade') {
      discipline.totalUnauthorizedTrades += 1;
    }

    await this.disciplineRepo.save(discipline);
  }

  async awardBadge(
    userId: string,
    badgeId: keyof typeof BADGES,
  ): Promise<boolean> {
    const discipline = await this.getOrCreateDiscipline(userId);
    const existingBadges = discipline.badges || [];
    const badgeDef = BADGES[badgeId];

    if (existingBadges.find((b) => b.id === badgeDef.id)) {
      return false; // Already has badge
    }

    const newBadge: Badge = {
      ...badgeDef,
      earnedAt: new Date(),
    };

    discipline.badges = [...existingBadges, newBadge];
    await this.disciplineRepo.save(discipline);
    return true;
  }

  private async incrementApprovedTrades(userId: string): Promise<void> {
    const discipline = await this.getOrCreateDiscipline(userId);
    discipline.totalApprovedTrades += 1;
    await this.disciplineRepo.save(discipline);

    if (discipline.totalApprovedTrades === 1) {
      await this.awardBadge(userId, 'FIRST_BLOOD');
    }
  }

  // ============== TRADE APPROVALS ==============

  async createApproval(
    userId: string,
    dto: CreateApprovalDto,
  ): Promise<TradeApproval> {
    await this.expireOldApprovals();

    // Check for active cooldown - ADVISORY: warn but allow with penalty
    const activeCooldown = await this.getActiveCooldown(userId);
    let cooldownPenalty = false;
    if (
      activeCooldown &&
      !activeCooldown.isCompleted &&
      !activeCooldown.isSkipped
    ) {
      // Advisory mode: allow trading but apply penalty
      cooldownPenalty = true;
      await this.updateDisciplineScore(userId, -5); // 5 point penalty
    }

    // Verify all checklist items are checked
    const uncheckedItems = dto.checklistResponses.filter((r) => !r.checked);
    if (uncheckedItems.length > 0) {
      throw new BadRequestException(
        'All checklist items must be checked before approval',
      );
    }

    // Auto-approve only when risk inputs are supplied. Otherwise keep pending.
    const shouldAutoApprove =
      dto.calculatedLotSize !== undefined &&
      dto.stopLoss !== undefined &&
      dto.accountId !== undefined;

    const approval = this.approvalRepo.create({
      userId,
      ...dto,
      status: shouldAutoApprove ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING,
      approvedAt: shouldAutoApprove ? new Date() : undefined,
      expiresAt: shouldAutoApprove
        ? new Date(Date.now() + 60 * 1000)
        : undefined,
      metadata: {
        cooldownBypass: cooldownPenalty,
        autoApproved: shouldAutoApprove,
      },
    });

    await this.approvalRepo.save(approval);

    // Award XP for completing checklist
    await this.addXp(
      userId,
      XP_REWARDS.CHECKLIST_COMPLETE,
      'checklist_complete',
    );

    if (shouldAutoApprove && dto.accountId && approval.calculatedLotSize) {
      approval.stopLoss = dto.stopLoss!;
      approval.takeProfit = dto.takeProfit ?? 0;
      await this.sendUnlockCommand(approval);
      await this.incrementApprovedTrades(userId);
    }

    return approval;
  }

  async approveAndUnlock(
    userId: string,
    approvalId: string,
    dto: ApproveTradeDto,
  ): Promise<TradeApproval> {
    await this.expireOldApprovals();

    const approval = await this.approvalRepo.findOne({
      where: { id: approvalId, userId },
    });
    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (
      approval.status !== ApprovalStatus.PENDING &&
      approval.status !== ApprovalStatus.APPROVED
    ) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }

    const transitioningFromPending = approval.status === ApprovalStatus.PENDING;

    // Update approval with calculated values
    approval.calculatedLotSize = dto.calculatedLotSize;
    approval.stopLoss = dto.stopLoss;
    approval.takeProfit = dto.takeProfit ?? 0;
    approval.status = ApprovalStatus.APPROVED;
    approval.approvedAt = approval.approvedAt || new Date();
    approval.expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    await this.approvalRepo.save(approval);

    // Send UNLOCK_TRADING command to MT5
    if (approval.accountId) {
      await this.sendUnlockCommand(approval);
    }

    if (transitioningFromPending) {
      await this.incrementApprovedTrades(userId);
    }

    return approval;
  }

  private async sendUnlockCommand(approval: TradeApproval): Promise<void> {
    const payload = [
      approval.symbol,
      approval.direction === 'Long' ? 'BUY' : 'SELL',
      approval.calculatedLotSize?.toFixed(2) || '0.01',
      approval.stopLoss?.toFixed(5) || '0',
      approval.takeProfit?.toFixed(5) || '0',
      approval.id,
    ].join(',');

    // Get terminal for this account
    const terminal = await this.terminalFarmService.findTerminalForAccount(
      approval.accountId,
    );
    if (terminal) {
      this.terminalFarmService.queueCommand(
        terminal.id,
        'UNLOCK_TRADING',
        payload,
      );
    }
  }

  async markExecuted(approvalId: string, tradeId: string): Promise<void> {
    const approval = await this.approvalRepo.findOne({
      where: { id: approvalId },
    });
    if (!approval) return;

    if (
      approval.status === ApprovalStatus.EXECUTED &&
      approval.executedTradeId === tradeId
    ) {
      return;
    }

    if (
      approval.status !== ApprovalStatus.APPROVED &&
      approval.status !== ApprovalStatus.PENDING
    ) {
      return;
    }

    approval.status = ApprovalStatus.EXECUTED;
    approval.executedTradeId = tradeId;
    await this.approvalRepo.save(approval);

    const discipline = await this.getOrCreateDiscipline(approval.userId);
    discipline.totalExecutedTrades += 1;
    await this.disciplineRepo.save(discipline);

    await this.addXp(
      approval.userId,
      XP_REWARDS.TRADE_EXECUTED,
      'trade_executed',
    );
    await this.updateStreak(approval.userId);

    // Check for speed demon badge (executed within 10s)
    const timeTaken = Date.now() - new Date(approval.approvedAt).getTime();
    if (timeTaken < 10000) {
      await this.awardBadge(approval.userId, 'SPEED_DEMON');
    }
  }

  async expireOldApprovals(): Promise<void> {
    await this.approvalRepo.update(
      {
        status: ApprovalStatus.APPROVED,
        expiresAt: LessThan(new Date()),
      },
      { status: ApprovalStatus.EXPIRED },
    );
  }

  async getActiveApproval(userId: string): Promise<TradeApproval | null> {
    await this.expireOldApprovals();

    return this.approvalRepo
      .createQueryBuilder('approval')
      .where('approval.userId = :userId', { userId })
      .andWhere('approval.status = :status', { status: ApprovalStatus.APPROVED })
      .andWhere('(approval.expiresAt IS NULL OR approval.expiresAt > :now)', {
        now: new Date(),
      })
      .orderBy('approval.createdAt', 'DESC')
      .getOne();
  }

  async getPendingApprovals(userId: string): Promise<TradeApproval[]> {
    return this.approvalRepo.find({
      where: { userId, status: ApprovalStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async getApprovalHistory(
    userId: string,
    limit = 20,
  ): Promise<TradeApproval[]> {
    return this.approvalRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ============== COOLDOWNS ==============

  async getActiveCooldown(userId: string): Promise<CooldownSession | null> {
    return this.cooldownRepo
      .createQueryBuilder('cooldown')
      .where('cooldown.userId = :userId', { userId })
      .andWhere('cooldown.isCompleted = false')
      .andWhere('cooldown.isSkipped = false')
      .andWhere('(cooldown.expiresAt IS NULL OR cooldown.expiresAt > :now)', {
        now: new Date(),
      })
      .orderBy('cooldown.startedAt', 'DESC')
      .getOne();
  }

  async triggerCooldown(
    userId: string,
    reason: CooldownTrigger,
    durationMinutes?: number,
  ): Promise<CooldownSession> {
    // Default durations per trigger
    const defaultDurations: Record<CooldownTrigger, number> = {
      [CooldownTrigger.LOSS_STREAK]: 15,
      [CooldownTrigger.OVERTRADING]: 60,
      [CooldownTrigger.REVENGE_TRADE]: 45,
      [CooldownTrigger.UNAUTHORIZED_TRADE]: 30,
      [CooldownTrigger.OUTSIDE_HOURS]: 10,
      [CooldownTrigger.MANUAL]: 15,
    };

    const duration = durationMinutes || defaultDurations[reason];
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const cooldown = this.cooldownRepo.create({
      userId,
      triggerReason: reason,
      durationMinutes: duration,
      expiresAt,
      requiredExercises: this.getRequiredExercises(reason),
    });

    await this.cooldownRepo.save(cooldown);
    return cooldown;
  }

  private getRequiredExercises(reason: CooldownTrigger): string[] {
    switch (reason) {
      case CooldownTrigger.LOSS_STREAK:
        return ['breathing', 'journal'];
      case CooldownTrigger.REVENGE_TRADE:
        return ['breathing', 'past_mistakes'];
      case CooldownTrigger.UNAUTHORIZED_TRADE:
        return ['risk_visualization'];
      case CooldownTrigger.OVERTRADING:
        return ['breathing', 'journal', 'risk_visualization'];
      default:
        return ['breathing'];
    }
  }

  async completeExercise(
    userId: string,
    cooldownId: string,
    exerciseId: string,
  ): Promise<CooldownSession> {
    const cooldown = await this.cooldownRepo.findOne({
      where: { id: cooldownId, userId },
    });
    if (!cooldown) {
      throw new NotFoundException('Cooldown not found');
    }

    const alreadyCompleted = cooldown.exercisesCompleted.find(
      (e) => e.exerciseId === exerciseId,
    );
    if (!alreadyCompleted) {
      cooldown.exercisesCompleted.push({
        exerciseId,
        name: exerciseId,
        completedAt: new Date(),
      });
    }

    // Check if all required exercises are completed
    const allComplete = cooldown.requiredExercises.every((reqId) =>
      cooldown.exercisesCompleted.find((e) => e.exerciseId === reqId),
    );

    if (allComplete) {
      cooldown.isCompleted = true;
      cooldown.completedAt = new Date();
      await this.addXp(userId, XP_REWARDS.BRAIN_TRAINING, 'brain_training');

      // Check for Zen Master badge
      const completedCount = await this.cooldownRepo.count({
        where: { userId, isCompleted: true },
      });
      if (completedCount >= 10) {
        await this.awardBadge(userId, 'ZEN_MASTER');
      }
    }

    await this.cooldownRepo.save(cooldown);
    return cooldown;
  }

  async skipCooldown(
    userId: string,
    cooldownId: string,
  ): Promise<CooldownSession> {
    const cooldown = await this.cooldownRepo.findOne({
      where: { id: cooldownId, userId },
    });
    if (!cooldown) {
      throw new NotFoundException('Cooldown not found');
    }

    cooldown.isSkipped = true;
    await this.cooldownRepo.save(cooldown);

    // Penalize for skipping
    await this.recordViolation(userId, 'cooldown_skipped');

    return cooldown;
  }

  async getCooldownHistory(
    userId: string,
    limit = 10,
  ): Promise<CooldownSession[]> {
    return this.cooldownRepo.find({
      where: { userId },
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }
}
