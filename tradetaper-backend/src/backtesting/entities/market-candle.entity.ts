import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('market_candles')
@Index(['symbol', 'timeframe', 'timestamp'], { unique: true })
@Index(['symbol', 'timeframe'])
export class MarketCandle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  @Index()
  symbol: string;

  @Column({ length: 10 })
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d'

  @Column('timestamptz')
  @Index()
  timestamp: Date;

  @Column('decimal', { precision: 19, scale: 8 })
  open: number;

  @Column('decimal', { precision: 19, scale: 8 })
  high: number;

  @Column('decimal', { precision: 19, scale: 8 })
  low: number;

  @Column('decimal', { precision: 19, scale: 8 })
  close: number;

  @Column('bigint', { nullable: true })
  volume: number;

  @Column({ length: 50, nullable: true })
  source: string; // 'yahoo', 'mt5', 'manual'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
