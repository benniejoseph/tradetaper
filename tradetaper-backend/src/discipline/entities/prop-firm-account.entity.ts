import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Prop firm challenge phases
export enum PropFirmPhase {
  EVALUATION = 'evaluation',
  VERIFICATION = 'verification',
  FUNDED = 'funded',
}

// Prop firm provider presets
export interface PropFirmRules {
  dailyDrawdownPercent: number; // Max daily loss (e.g., 5%)
  totalDrawdownPercent: number; // Max total loss (e.g., 10%)
  profitTargetPercent?: number; // Required profit target (e.g., 8%)
  minTradingDays?: number; // Minimum trading days
  maxPositionSize?: number; // Max lots per trade
  newsRestriction?: boolean; // No trading during news
  weekendHoldingAllowed?: boolean; // Can hold over weekend
}

// Common prop firm presets
export const PROP_FIRM_PRESETS: Record<string, PropFirmRules> = {
  FTMO: {
    dailyDrawdownPercent: 5,
    totalDrawdownPercent: 10,
    profitTargetPercent: 10,
    minTradingDays: 4,
    newsRestriction: true,
    weekendHoldingAllowed: false,
  },
  MFF: {
    dailyDrawdownPercent: 5,
    totalDrawdownPercent: 12,
    profitTargetPercent: 8,
    minTradingDays: 5,
    newsRestriction: false,
    weekendHoldingAllowed: true,
  },
  TOPSTEP: {
    dailyDrawdownPercent: 2,
    totalDrawdownPercent: 6,
    profitTargetPercent: 6,
    minTradingDays: 0,
    newsRestriction: false,
    weekendHoldingAllowed: false,
  },
  CUSTOM: {
    dailyDrawdownPercent: 5,
    totalDrawdownPercent: 10,
    profitTargetPercent: 10,
    minTradingDays: 0,
    newsRestriction: false,
    weekendHoldingAllowed: true,
  },
};

@Entity('prop_firm_accounts')
export class PropFirmAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  accountId: string; // Links to MT5Account

  @Column({ length: 100 })
  firmName: string; // FTMO, MFF, TopStep, Custom

  @Column({
    type: 'enum',
    enum: PropFirmPhase,
    default: PropFirmPhase.EVALUATION,
  })
  phase: PropFirmPhase;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  startingBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  currentBalance: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  dailyPnL: number;

  @Column({ type: 'date' })
  dailyPnLDate: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPnL: number;

  // Rules
  @Column({ type: 'jsonb', default: {} })
  rules: PropFirmRules;

  // Tracking
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  dailyDrawdownUsed: number; // Current daily drawdown %

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalDrawdownUsed: number; // Current total drawdown %

  @Column({ type: 'int', default: 0 })
  tradingDaysCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPassed: boolean;

  @Column({ type: 'boolean', default: false })
  isFailed: boolean;

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties (not stored)
  get dailyDrawdownRemaining(): number {
    return Math.max(
      0,
      this.rules.dailyDrawdownPercent - this.dailyDrawdownUsed,
    );
  }

  get totalDrawdownRemaining(): number {
    return Math.max(
      0,
      this.rules.totalDrawdownPercent - this.totalDrawdownUsed,
    );
  }

  get profitProgress(): number {
    if (!this.rules.profitTargetPercent) return 0;
    const profitPercent =
      ((this.currentBalance - this.startingBalance) / this.startingBalance) *
      100;
    return Math.min(
      100,
      (profitPercent / this.rules.profitTargetPercent) * 100,
    );
  }
}
