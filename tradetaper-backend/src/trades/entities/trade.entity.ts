// src/trades/entities/trade.entity.ts
import { User } from '../../users/entities/user.entity';
import { Type } from 'class-transformer';
import { Tag } from '../../tags/entities/tag.entity';
import {
  AssetType,
  TradeDirection,
  TradeStatus,
  ICTConcept,
  TradingSession,
  EmotionalState,
  ExecutionGrade,
  MarketCondition,
  HTFBias,
  Timeframe,
} from '../../types/enums';

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('trades')
@Index(['user', 'openTime']) // Example index for querying user's trades by date
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, {
    eager: false,
    onDelete: 'CASCADE',
  }) // 'eager: false' by default
  @JoinColumn({ name: 'userId' }) // Specifies the foreign key column name
  user: User; // Relation to User entity

  @Column()
  userId: string; // Foreign key storage

  // Strategy relationship
  @ManyToOne('Strategy', {
    eager: false,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'strategyId' })
  strategy: Record<string, unknown>;

  @Column({ nullable: true })
  strategyId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) // Added accountId
  accountId?: string;

  @Column({ type: 'boolean', nullable: true, default: false }) // New field for starring trades
  isStarred?: boolean;

  @Column({
    type: 'enum',
    enum: AssetType,
    default: AssetType.STOCK,
  })
  assetType: AssetType;

  @Column({ length: 50 })
  symbol: string;

  @Column({
    type: 'enum',
    enum: TradeDirection,
  })
  side: TradeDirection;

  @Column({
    type: 'enum',
    enum: TradeStatus,
    default: TradeStatus.OPEN,
  })
  status: TradeStatus;

  @Column('timestamptz') // timestamp with time zone
  openTime: Date;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8 }) // Suitable for prices
  openPrice: number;

  @Column('timestamptz', { nullable: true })
  closeTime?: Date;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  closePrice?: number;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8 }) // Suitable for quantity/size
  quantity: number;

  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  commission: number;

  @Type(() => Number) // Added swap
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  swap?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  marginUsed?: number; // Calculated: (Price * Quantity * ContractSize) / Leverage

  @Column('text', { nullable: true })
  notes?: string;

  // Calculated fields - these might be better as getters or calculated on read
  // For simplicity in DB, we might store them if frequently queried, or calculate in service
  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 4, nullable: true })
  profitOrLoss?: number;

  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  rMultiple?: number; // Risk-Reward Multiple

  // Fields for planned Stop Loss / Take Profit
  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  stopLoss?: number;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  takeProfit?: number;

  // strategiaTag was removed, this section is placeholder for its previous location.
  // It was previously defined as:
  // @Column({ type: 'varchar', length: 255, nullable: true })
  // strategyTag?: string;

  // ADDED ictConcept Column
  @Column({
    type: 'enum',
    enum: ICTConcept,
    nullable: true, // Make it optional
  })
  ictConcept?: ICTConcept;

  // ADDED session Column
  @Column({
    type: 'enum',
    enum: TradingSession,
    nullable: true, // Make it optional
  })
  session?: TradingSession;

  @Column('text', { nullable: true })
  setupDetails?: string; // Notes about the trade setup/rationale

  @Column('text', { nullable: true })
  mistakesMade?: string;

  @Column('text', { nullable: true })
  lessonsLearned?: string;

  @Column({ type: 'varchar', length: 1024, nullable: true }) // URL can be long
  imageUrl?: string; // For an external image URL

  // NEW: Many-to-Many relationship with Tag
  @Type(() => Tag)
  @ManyToMany(() => Tag, (tag) => tag.trades, { cascade: ['insert'] }) // Allow inserting new tags when creating/updating trade
  @JoinTable({
    // This will create the trade_tags_tag join table
    name: 'trade_tags', // Name of the join table
    joinColumn: { name: 'tradeId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @Column({
    type: 'varchar',
    length: 2048,
    nullable: true,
    name: 'chart_image_url',
  })
  chartImageUrl?: string;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  externalId?: string; // MT5 Position ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  externalDealId?: string; // MT5 Deal ID

  @Column({ type: 'bigint', nullable: true })
  mt5Magic?: number;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  contractSize?: number;

  @Column({ type: 'jsonb', nullable: true })
  executionCandles?: Record<string, unknown>[]; // Array of { time, open, high, low, close }

  // ========== PHASE 1: Psychology & Emotion Tracking ==========
  @Column({
    type: 'enum',
    enum: EmotionalState,
    nullable: true,
  })
  emotionBefore?: EmotionalState;

  @Column({
    type: 'enum',
    enum: EmotionalState,
    nullable: true,
  })
  emotionDuring?: EmotionalState;

  @Column({
    type: 'enum',
    enum: EmotionalState,
    nullable: true,
  })
  emotionAfter?: EmotionalState;

  @Column({ type: 'int', nullable: true })
  confidenceLevel?: number; // 1-10 scale

  @Column({ type: 'boolean', nullable: true })
  followedPlan?: boolean;

  @Column({ type: 'simple-array', nullable: true })
  ruleViolations?: string[]; // e.g., ["Moved SL", "Oversized", "FOMO Entry"]

  // ========== PHASE 2: Advanced Performance Metrics ==========
  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 4, nullable: true })
  plannedRR?: number; // Planned reward:risk ratio

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  maePrice?: number; // Maximum Adverse Excursion price

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  mfePrice?: number; // Maximum Favorable Excursion price

  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maePips?: number; // MAE in pips

  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  mfePips?: number; // MFE in pips

  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  slippage?: number; // Entry slippage in pips

  @Column({
    type: 'enum',
    enum: ExecutionGrade,
    nullable: true,
  })
  executionGrade?: ExecutionGrade; // Self-graded A-F

  // ========== PHASE 3: Market Context ==========
  @Column({
    type: 'enum',
    enum: MarketCondition,
    nullable: true,
  })
  marketCondition?: MarketCondition;

  @Column({
    type: 'enum',
    enum: Timeframe,
    nullable: true,
  })
  timeframe?: Timeframe; // Chart timeframe used

  @Column({
    type: 'enum',
    enum: HTFBias,
    nullable: true,
  })
  htfBias?: HTFBias; // Higher timeframe directional bias

  @Column({ type: 'boolean', nullable: true })
  newsImpact?: boolean; // Was high-impact news nearby?

  // ========== PHASE 4: Pre-Trade Checklist ==========
  @Column('text', { nullable: true })
  entryReason?: string; // Specific reason for entering

  @Column({ type: 'simple-array', nullable: true })
  confirmations?: string[]; // List of confirmations checked

  @Column({ type: 'boolean', nullable: true })
  hesitated?: boolean; // Did you hesitate on a valid setup?

  @Column({ type: 'boolean', nullable: true })
  preparedToLose?: boolean; // Were you emotionally prepared to lose?

  // ========== PHASE 5: Environmental Factors ==========
  @Column({ type: 'int', nullable: true })
  sleepQuality?: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  energyLevel?: number; // 1-5 scale

  @Column({ type: 'int', nullable: true })
  distractionLevel?: number; // 1-5 scale

  @Column({ type: 'varchar', length: 100, nullable: true })
  tradingEnvironment?: string; // e.g., "Home Office", "Mobile", "Noisy"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Method to calculate P&L (example, can be more complex)
  // This is a conceptual method. Actual P&L might be set by the service upon closing a trade.
  // Helper to determine contract size based on asset type or symbol
  getContractSize(): number {
    // 1. Prefer stored contract size if available
    if (this.contractSize) return this.contractSize;

    // 2. Fallback to heuristics (Legacy)
    if (!this.symbol) return 1;
    const s = this.symbol.toUpperCase();

    // Metals (Gold/Silver)
    if (s.includes('XAU') || s.includes('GOLD')) return 100;
    if (s.includes('XAG') || s.includes('SILVER')) return 5000;

    // Forex (Standard Lot = 100,000 units)
    if (this.assetType === AssetType.FOREX) return 100000;

    // Indices (Usually 1, 10, or 20 but broker dependent. 1 is safest default for CFDs)
    if (this.assetType === AssetType.INDICES) return 1;

    // Crypto, Stocks, Indices - Default to 1 (Spot/Shares)
    return 1;
  }

  // Method to calculate P&L (example, can be more complex)
  // This is a conceptual method. Actual P&L might be set by the service upon closing a trade.
  calculatePnl(): void {
    if (
      this.status === TradeStatus.CLOSED &&
      this.openPrice &&
      this.closePrice &&
      this.quantity
    ) {
      const contractSize = this.getContractSize();
      let pnl = 0;

      if (this.side === TradeDirection.LONG) {
        pnl = (this.closePrice - this.openPrice) * this.quantity * contractSize;
      } else if (this.side === TradeDirection.SHORT) {
        pnl = (this.openPrice - this.closePrice) * this.quantity * contractSize;
      }
      this.profitOrLoss = parseFloat(
        (pnl + (this.commission || 0) + (this.swap || 0)).toFixed(4),
      );
    } else {
      this.profitOrLoss = undefined;
    }
  }
}
