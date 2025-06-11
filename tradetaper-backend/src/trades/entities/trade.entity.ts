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

  // Strategy relationship temporarily commented out
  // @ManyToOne('Strategy', {
  //   eager: false,
  //   onDelete: 'SET NULL',
  // })
  // @JoinColumn({ name: 'strategyId' })
  // strategy: any;

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
      this.openPrice &&
      this.closePrice &&
      this.quantity
    ) {
      let pnl = 0;
      if (this.side === TradeDirection.LONG) {
        pnl = (this.closePrice - this.openPrice) * this.quantity;
      } else if (this.side === TradeDirection.SHORT) {
        pnl = (this.openPrice - this.closePrice) * this.quantity;
      }
      this.profitOrLoss = parseFloat((pnl - (this.commission || 0)).toFixed(4));
    } else {
      this.profitOrLoss = undefined;
    }
  }
}
