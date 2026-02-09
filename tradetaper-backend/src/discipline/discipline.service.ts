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
  ChecklistResponse,
} from './entities/trade-approval.entity';
import {
  TraderDiscipline,
  Badge,
  DailyStats,
} from './entities/trader-discipline.entity';
import {
  CooldownSession,
  CooldownTrigger,
} from './entities/cooldown-session.entity';
import { CreateApprovalDto, ApproveTradeDto } from './dto/discipline.dto';
import { TerminalFarmService } from '../terminal-farm/terminal-farm.service';

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

  async getDisciplineStats(userId: string): Promise<TraderDiscipline> {
    return this.getOrCreateDiscipline(userId);
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
    discipline.disciplineScore = Math.max(
      0,
      Math.min(100, discipline.disciplineScore + delta),
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

    if (existingBadges.find((b) => b.id === badgeId)) {
      return false; // Already has badge
    }

    const badgeDef = BADGES[badgeId];
    const newBadge: Badge = {
      ...badgeDef,
      earnedAt: new Date(),
    };

    discipline.badges = [...existingBadges, newBadge];
    await this.disciplineRepo.save(discipline);
    return true;
  }

  // ============== TRADE APPROVALS ==============

  async createApproval(
    userId: string,
    dto: CreateApprovalDto,
  ): Promise<TradeApproval> {
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

    // AUTO-APPROVAL: When checklist is complete, automatically approve
    const approval = this.approvalRepo.create({
      userId,
      ...dto,
      status: ApprovalStatus.APPROVED, // Auto-approved since checklist is complete
      approvedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 1000), // 60 second unlock window
      metadata: {
        cooldownBypass: cooldownPenalty,
        autoApproved: true,
      },
    });

    await this.approvalRepo.save(approval);

    // Award XP for completing checklist
    await this.addXp(
      userId,
      XP_REWARDS.CHECKLIST_COMPLETE,
      'checklist_complete',
    );

    // Send unlock command to MT5 immediately (auto-approval)
    if (dto.accountId && approval.calculatedLotSize) {
      approval.stopLoss = dto.stopLoss ?? 0;
      approval.takeProfit = dto.takeProfit ?? 0;
      await this.sendUnlockCommand(approval);
    }

    return approval;
  }

  async approveAndUnlock(
    userId: string,
    approvalId: string,
    dto: ApproveTradeDto,
  ): Promise<TradeApproval> {
    const approval = await this.approvalRepo.findOne({
      where: { id: approvalId, userId },
    });
    if (!approval) {
      throw new NotFoundException('Approval not found');
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }

    // Update approval with calculated values
    approval.calculatedLotSize = dto.calculatedLotSize;
    approval.stopLoss = dto.stopLoss;
    approval.takeProfit = dto.takeProfit ?? 0;
    approval.status = ApprovalStatus.APPROVED;
    approval.approvedAt = new Date();
    approval.expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    await this.approvalRepo.save(approval);

    // Send UNLOCK_TRADING command to MT5
    if (approval.accountId) {
      await this.sendUnlockCommand(approval);
    }

    const discipline = await this.getOrCreateDiscipline(userId);
    discipline.totalApprovedTrades += 1;
    await this.disciplineRepo.save(discipline);

    // Check for first trade badge
    if (discipline.totalApprovedTrades === 1) {
      await this.awardBadge(userId, 'FIRST_BLOOD');
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
    return this.approvalRepo.findOne({
      where: {
        userId,
        status: ApprovalStatus.APPROVED,
      },
      order: { createdAt: 'DESC' },
    });
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
    return this.cooldownRepo.findOne({
      where: {
        userId,
        isCompleted: false,
        isSkipped: false,
      },
      order: { startedAt: 'DESC' },
    });
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
