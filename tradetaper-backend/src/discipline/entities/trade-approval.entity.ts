import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
  REJECTED = 'rejected',
}

export interface ChecklistResponse {
  itemId: string;
  text: string;
  checked: boolean;
}

@Entity('trade_approvals')
export class TradeApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  accountId: string;

  @Column({ nullable: true })
  strategyId: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 10 })
  direction: string; // 'Long' | 'Short'

  @Column({ type: 'jsonb', default: [] })
  checklistResponses: ChecklistResponse[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  riskPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  calculatedLotSize: number;

  @Column({ type: 'decimal', precision: 15, scale: 5, nullable: true })
  stopLoss: number;

  @Column({ type: 'decimal', precision: 15, scale: 5, nullable: true })
  takeProfit: number;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status: ApprovalStatus;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  executedTradeId: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'jsonb', default: {}, nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
