import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Strategy } from '../../strategies/entities/strategy.entity';
import { User } from '../../users/entities/user.entity';
import { TradeDirection, TradingSession, ICTConcept } from '../../types/enums';

export enum Timeframe {
  M1 = 'M1',
  M5 = 'M5',
  M15 = 'M15',
  M30 = 'M30',
  H1 = 'H1',
  H4 = 'H4',
  D1 = 'D1',
  W1 = 'W1',
}

export enum KillZone {
  LONDON_OPEN = 'london_open',
  NY_OPEN = 'ny_open',
  NY_CLOSE = 'ny_close',
  ASIA_OPEN = 'asia_open',
  OVERLAP = 'overlap',
  NONE = 'none',
}

export enum MarketStructure {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  CONSOLIDATING = 'consolidating',
}

export enum HTFBias {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  NEUTRAL = 'neutral',
}

export enum TradeOutcome {
  WIN = 'win',
  LOSS = 'loss',
  BREAKEVEN = 'breakeven',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
}

@Entity('backtest_trades')
@Index(['strategyId', 'userId'])
@Index(['symbol', 'session', 'timeframe'])
export class BacktestTrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Strategy, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'strategyId' })
  strategy: Strategy;

  @Column()
  @Index()
  strategyId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  // Trade Details
  @Column({ length: 20 })
  @Index()
  symbol: string;

  @Column({
    type: 'enum',
    enum: TradeDirection,
  })
  direction: TradeDirection;

  @Column('decimal', { precision: 19, scale: 8 })
  entryPrice: number;

  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  exitPrice: number;

  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  stopLoss: number;

  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  takeProfit: number;

  @Column('decimal', { precision: 10, scale: 4, default: 1.0 })
  lotSize: number;

  // Timing Dimensions
  @Column({
    type: 'enum',
    enum: Timeframe,
  })
  @Index()
  timeframe: Timeframe;

  @Column({
    type: 'enum',
    enum: TradingSession,
    nullable: true,
  })
  @Index()
  session: TradingSession;

  @Column({
    type: 'enum',
    enum: KillZone,
    nullable: true,
  })
  killZone: KillZone;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    nullable: true,
  })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'int', nullable: true })
  hourOfDay: number; // 0-23 UTC

  @Column({ type: 'date' })
  @Index()
  tradeDate: Date;

  // Entry/Exit Times (stored as UTC, displayed as EST/EDT - America/New_York)
  @Column({ type: 'timestamptz', nullable: true })
  entryTime: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  exitTime: Date | null;

  // Setup Details
  @Column({ length: 100, nullable: true })
  setupType: string; // FVG, OB, BOS, CHoCH, etc.

  @Column({
    type: 'enum',
    enum: ICTConcept,
    nullable: true,
  })
  ictConcept: ICTConcept;

  @Column({
    type: 'enum',
    enum: MarketStructure,
    nullable: true,
  })
  marketStructure: MarketStructure;

  @Column({
    type: 'enum',
    enum: HTFBias,
    nullable: true,
  })
  htfBias: HTFBias;

  // Results
  @Column({
    type: 'enum',
    enum: TradeOutcome,
  })
  @Index()
  outcome: TradeOutcome;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  pnlPips: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  pnlDollars: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  rMultiple: number;

  @Column({ type: 'int', nullable: true })
  holdingTimeMinutes: number;

  // Quality Metrics
  @Column({ type: 'int', nullable: true })
  entryQuality: number; // 1-5

  @Column({ type: 'int', nullable: true })
  executionQuality: number; // 1-5

  @Column({ type: 'boolean', default: true })
  followedRules: boolean;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  checklistScore: number; // Percentage

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 2048, nullable: true })
  screenshotUrl: string;

  @Column({ type: 'text', nullable: true })
  lessonLearned: string;

  // Metadata
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
