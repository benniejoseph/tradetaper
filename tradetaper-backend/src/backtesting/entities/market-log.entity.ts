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
import { User } from '../../users/entities/user.entity';
import {
  TradingSession,
  MarketMovementType,
  MarketSentiment,
} from '../../types/enums';
import { Timeframe } from './backtest-trade.entity';

@Entity('market_logs')
@Index(['userId', 'tradeDate'])
@Index(['tags']) // GIN index for array might be better in postgres, but simple index for now
export class MarketLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  // Context
  @Column({ length: 20 })
  @Index()
  symbol: string;

  @Column({ type: 'date' })
  @Index()
  tradeDate: Date;

  @Column({
    type: 'enum',
    enum: Timeframe,
  })
  timeframe: Timeframe;

  @Column({
    type: 'enum',
    enum: TradingSession,
    nullable: true,
  })
  session: TradingSession;

  // Time Range (stored as UTC, displayed as EST/EDT - America/New_York)
  @Column({ type: 'timestamptz', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date;

  // Analysis
  @Column('simple-array', { nullable: true })
  tags: string[]; // e.g. ["fvg", "sweep", "monday_high"]

  @Column({ type: 'text' })
  observation: string;

  @Column({
    type: 'enum',
    enum: MarketMovementType,
    nullable: true,
  })
  movementType: MarketMovementType;

  @Column({ type: 'int', default: 3 })
  significance: number; // 1-5 rating

  @Column({
    type: 'enum',
    enum: MarketSentiment,
    nullable: true,
  })
  sentiment: MarketSentiment;

  @Column({ length: 2048, nullable: true })
  screenshotUrl: string;

  // Metadata
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
