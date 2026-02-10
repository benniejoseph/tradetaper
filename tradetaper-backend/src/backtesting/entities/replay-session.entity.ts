import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('replay_sessions')
@Index(['userId'])
@Index(['symbol'])
@Index(['status'])
export class ReplaySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 10 })
  timeframe: string;

  @Column('timestamptz')
  startDate: Date;

  @Column('timestamptz')
  endDate: Date;

  @Column('decimal', { precision: 15, scale: 2, default: 100000 })
  startingBalance: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  endingBalance: number;

  @Column('json', { nullable: true })
  trades: Record<string, unknown>[]; // Array of {entry, exit, pnl, type}

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalPnl: number;

  @Column({ type: 'int', nullable: true })
  totalTrades: number;

  @Column({ type: 'int', nullable: true })
  winningTrades: number;

  @Column({ type: 'int', nullable: true })
  losingTrades: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  winRate: number;

  @Column({
    type: 'enum',
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
