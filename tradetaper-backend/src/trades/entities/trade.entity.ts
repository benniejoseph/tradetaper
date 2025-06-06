// src/trades/entities/trade.entity.ts
import { User } from '../../users/entities/user.entity'; // Adjust path
import { Type } from 'class-transformer';
import { Tag } from '../../tags/entities/tag.entity';

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
  JoinTable, // Import ManyToMany, JoinTable
} from 'typeorm';

export enum AssetType {
  STOCK = 'Stock',
  CRYPTO = 'Crypto',
  FOREX = 'Forex',
  FUTURES = 'Futures',
  OPTIONS = 'Options',
}

export enum TradeDirection {
  LONG = 'Long',
  SHORT = 'Short',
}

export enum TradeStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
  PENDING = 'Pending', // For planned trades
  CANCELLED = 'Cancelled', // ADDED from frontend type
}

// ADDED ICTConcept Enum
export enum ICTConcept {
  FVG = 'Fair Value Gap',
  ORDER_BLOCK = 'Order Block',
  BREAKER_BLOCK = 'Breaker Block',
  MITIGATION_BLOCK = 'Mitigation Block',
  LIQUIDITY_GRAB = 'Liquidity Grab (BSL/SSL)',
  LIQUIDITY_VOID = 'Liquidity Void',
  SILVER_BULLET = 'Silver Bullet',
  JUDAS_SWING = 'Judas Swing',
  SMT_DIVERGENCE = 'SMT Divergence',
  POWER_OF_THREE = 'Power of Three (AMD)',
  OPTIMAL_TRADE_ENTRY = 'Optimal Trade Entry (OTE)',
  MARKET_STRUCTURE_SHIFT = 'Market Structure Shift (MSS)',
  OTHER = 'Other',
}

// ADDED TradingSession Enum
export enum TradingSession {
  LONDON = 'London',
  NEW_YORK = 'New York',
  ASIA = 'Asia',
  LONDON_NY_OVERLAP = 'London-NY Overlap',
  OTHER = 'Other',
}

@Entity('trades')
@Index(['user', 'entryDate']) // Example index for querying user's trades by date
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
  direction: TradeDirection;

  @Column({
    type: 'enum',
    enum: TradeStatus,
    default: TradeStatus.OPEN,
  })
  status: TradeStatus;

  @Column('timestamptz') // timestamp with time zone
  entryDate: Date;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8 }) // Suitable for prices
  entryPrice: number;

  @Column('timestamptz', { nullable: true })
  exitDate?: Date;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8, nullable: true })
  exitPrice?: number;

  @Type(() => Number)
  @Column('decimal', { precision: 19, scale: 8 }) // Suitable for quantity/size
  quantity: number;

  @Type(() => Number)
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  commission: number;

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
  tags: Tag[]; // Array of Tag entities associated with this trade

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Method to calculate P&L (example, can be more complex)
  // This is a conceptual method. Actual P&L might be set by the service upon closing a trade.
  calculatePnl(): void {
    if (
      this.status === TradeStatus.CLOSED &&
      this.entryPrice &&
      this.exitPrice &&
      this.quantity
    ) {
      let pnl = 0;
      if (this.direction === TradeDirection.LONG) {
        pnl = (this.exitPrice - this.entryPrice) * this.quantity;
      } else if (this.direction === TradeDirection.SHORT) {
        pnl = (this.entryPrice - this.exitPrice) * this.quantity;
      }
      this.profitOrLoss = parseFloat((pnl - (this.commission || 0)).toFixed(4));
    } else {
      this.profitOrLoss = undefined;
    }
  }
}
