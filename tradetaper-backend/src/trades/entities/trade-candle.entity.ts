// src/trades/entities/trade-candle.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Trade } from './trade.entity';

@Entity('trade_candles')
@Index(['trade', 'timeframe'], { unique: true }) // Ensure one cache entry per trade+timeframe
export class TradeCandle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trade, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tradeId' })
  trade: Trade;

  @Column()
  tradeId: string;

  @Column()
  symbol: string;

  @Column()
  timeframe: string;

  @Column('json')
  data: Record<string, unknown>[];

  @CreateDateColumn()
  createdAt: Date;
}
