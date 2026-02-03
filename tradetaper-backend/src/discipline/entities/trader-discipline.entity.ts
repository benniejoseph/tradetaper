import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: Date;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  tradesApproved: number;
  tradesExecuted: number;
  violations: number;
  xpEarned: number;
  disciplineScore: number;
}

@Entity('trader_discipline')
export class TraderDiscipline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @Column({ default: 0 })
  xpTotal: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  currentStreak: number;

  @Column({ default: 0 })
  longestStreak: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100.0 })
  disciplineScore: number;

  @Column({ default: 0 })
  totalApprovedTrades: number;

  @Column({ default: 0 })
  totalExecutedTrades: number;

  @Column({ default: 0 })
  totalRuleViolations: number;

  @Column({ default: 0 })
  totalUnauthorizedTrades: number;

  @Column({ type: 'jsonb', default: [] })
  badges: Badge[];

  @Column({ type: 'jsonb', default: {} })
  dailyStats: Record<string, DailyStats>;

  @Column({ nullable: true })
  lastTradeAt: Date;

  @Column({ nullable: true })
  lastViolationAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
