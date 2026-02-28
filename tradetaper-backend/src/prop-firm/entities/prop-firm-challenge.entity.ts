import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum PropFirmPhase {
  CHALLENGE = 'challenge',
  VERIFICATION = 'verification',
  FUNDED = 'funded',
  EXPRESS = 'express',
}

export enum PropFirmStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('prop_firm_challenges')
export class PropFirmChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column({ length: 100 })
  firmName: string;

  @Column({ type: 'enum', enum: PropFirmPhase, default: PropFirmPhase.CHALLENGE })
  phase: PropFirmPhase;

  /** Starting account size in USD */
  @Column({ type: 'decimal', precision: 19, scale: 2 })
  accountSize: number;

  /** Required profit to pass this phase (%) */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  profitTargetPct: number;

  /** Maximum daily drawdown allowed (%) */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  dailyDrawdownLimitPct: number;

  /** Maximum total drawdown allowed from initial balance (%) */
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxDrawdownLimitPct: number;

  /** Balance at start of challenge */
  @Column({ type: 'decimal', precision: 19, scale: 2 })
  startBalance: number;

  /** Today's starting balance (for daily drawdown calc) */
  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  todayStartBalance: number;

  /** Current account balance */
  @Column({ type: 'decimal', precision: 19, scale: 2 })
  currentBalance: number;

  /** Current account equity */
  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  currentEquity: number;

  @Column({ type: 'date' })
  startDate: Date;

  /** Optional end date / deadline for this phase */
  @Column({ type: 'date', nullable: true })
  endDate: Date | null;

  @Column({
    type: 'enum',
    enum: PropFirmStatus,
    default: PropFirmStatus.ACTIVE,
  })
  status: PropFirmStatus;

  /** Broker/platform (e.g. MT5, cTrader) */
  @Column({ length: 50, nullable: true })
  platform: string | null;

  /** Razorpay order ID if connected to a MetaAPI account */
  @Column({ length: 255, nullable: true })
  mt5AccountId: string | null;

  /** Free-form notes */
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
