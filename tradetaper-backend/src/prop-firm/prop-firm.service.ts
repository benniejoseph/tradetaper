import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PropFirmChallenge,
  PropFirmPhase,
  PropFirmStatus,
} from './entities/prop-firm-challenge.entity';

export interface CreatePropFirmChallengeDto {
  firmName: string;
  phase?: PropFirmPhase;
  accountSize: number;
  profitTargetPct: number;
  dailyDrawdownLimitPct: number;
  maxDrawdownLimitPct: number;
  startBalance: number;
  currentBalance: number;
  currentEquity?: number;
  startDate: string;
  endDate?: string;
  platform?: string;
  mt5AccountId?: string;
  notes?: string;
}

export interface UpdatePropFirmChallengeDto extends Partial<CreatePropFirmChallengeDto> {
  status?: PropFirmStatus;
  todayStartBalance?: number;
}

export interface PropFirmChallengeWithStats extends PropFirmChallenge {
  currentProfitPct: number;
  currentDailyDrawdownPct: number;
  currentMaxDrawdownPct: number;
  daysRemaining: number | null;
  statusBadge: 'passing' | 'at_risk' | 'failed' | 'passed';
}

@Injectable()
export class PropFirmService {
  private readonly logger = new Logger(PropFirmService.name);

  constructor(
    @InjectRepository(PropFirmChallenge)
    private readonly repo: Repository<PropFirmChallenge>,
  ) {}

  async create(userId: string, dto: CreatePropFirmChallengeDto): Promise<PropFirmChallengeWithStats> {
    const challenge = this.repo.create({
      userId,
      firmName: dto.firmName,
      phase: dto.phase ?? PropFirmPhase.CHALLENGE,
      accountSize: dto.accountSize,
      profitTargetPct: dto.profitTargetPct,
      dailyDrawdownLimitPct: dto.dailyDrawdownLimitPct,
      maxDrawdownLimitPct: dto.maxDrawdownLimitPct,
      startBalance: dto.startBalance,
      todayStartBalance: dto.startBalance,
      currentBalance: dto.currentBalance,
      currentEquity: dto.currentEquity ?? dto.currentBalance,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      platform: dto.platform ?? null,
      mt5AccountId: dto.mt5AccountId ?? null,
      notes: dto.notes ?? null,
    });
    const saved = await this.repo.save(challenge);
    return this.withStats(saved);
  }

  async findAll(userId: string): Promise<PropFirmChallengeWithStats[]> {
    const challenges = await this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return challenges.map((c) => this.withStats(c));
  }

  async findOne(userId: string, id: string): Promise<PropFirmChallengeWithStats> {
    const challenge = await this.repo.findOne({ where: { id, userId } });
    if (!challenge) throw new NotFoundException(`Challenge ${id} not found`);
    return this.withStats(challenge);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdatePropFirmChallengeDto,
  ): Promise<PropFirmChallengeWithStats> {
    const challenge = await this.repo.findOne({ where: { id, userId } });
    if (!challenge) throw new NotFoundException(`Challenge ${id} not found`);

    Object.assign(challenge, {
      ...(dto.firmName !== undefined && { firmName: dto.firmName }),
      ...(dto.phase !== undefined && { phase: dto.phase }),
      ...(dto.accountSize !== undefined && { accountSize: dto.accountSize }),
      ...(dto.profitTargetPct !== undefined && { profitTargetPct: dto.profitTargetPct }),
      ...(dto.dailyDrawdownLimitPct !== undefined && { dailyDrawdownLimitPct: dto.dailyDrawdownLimitPct }),
      ...(dto.maxDrawdownLimitPct !== undefined && { maxDrawdownLimitPct: dto.maxDrawdownLimitPct }),
      ...(dto.startBalance !== undefined && { startBalance: dto.startBalance }),
      ...(dto.todayStartBalance !== undefined && { todayStartBalance: dto.todayStartBalance }),
      ...(dto.currentBalance !== undefined && { currentBalance: dto.currentBalance }),
      ...(dto.currentEquity !== undefined && { currentEquity: dto.currentEquity }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.platform !== undefined && { platform: dto.platform }),
      ...(dto.mt5AccountId !== undefined && { mt5AccountId: dto.mt5AccountId }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    const updated = await this.repo.save(challenge);
    return this.withStats(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const challenge = await this.repo.findOne({ where: { id, userId } });
    if (!challenge) throw new NotFoundException(`Challenge ${id} not found`);
    await this.repo.remove(challenge);
  }

  /* ── Stats computation ─────────────────────────────────── */

  private withStats(c: PropFirmChallenge): PropFirmChallengeWithStats {
    const startBal    = Number(c.startBalance);
    const todayBal    = Number(c.todayStartBalance) || startBal;
    const curBal      = Number(c.currentBalance);
    const curEq       = Number(c.currentEquity) || curBal;
    const profitPct   = startBal > 0 ? ((curBal - startBal) / startBal) * 100 : 0;
    const dailyDdPct  = todayBal > 0 ? ((todayBal - Math.min(curBal, curEq)) / todayBal) * 100 : 0;
    const maxDdPct    = startBal > 0 ? ((startBal - Math.min(curBal, curEq)) / startBal) * 100 : 0;

    const daysRemaining = c.endDate
      ? Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000))
      : null;

    const dailyLimit = Number(c.dailyDrawdownLimitPct);
    const maxLimit   = Number(c.maxDrawdownLimitPct);
    const profitTarget = Number(c.profitTargetPct);

    let statusBadge: 'passing' | 'at_risk' | 'failed' | 'passed' = 'passing';
    if (c.status === PropFirmStatus.PASSED) {
      statusBadge = 'passed';
    } else if (c.status === PropFirmStatus.FAILED || dailyDdPct >= dailyLimit || maxDdPct >= maxLimit) {
      statusBadge = 'failed';
    } else if (profitPct >= profitTarget) {
      statusBadge = 'passed';
    } else if (dailyDdPct >= dailyLimit * 0.8 || maxDdPct >= maxLimit * 0.8) {
      statusBadge = 'at_risk';
    }

    return {
      ...c,
      currentProfitPct: Math.round(profitPct * 100) / 100,
      currentDailyDrawdownPct: Math.round(dailyDdPct * 100) / 100,
      currentMaxDrawdownPct: Math.round(maxDdPct * 100) / 100,
      daysRemaining,
      statusBadge,
    };
  }
}
