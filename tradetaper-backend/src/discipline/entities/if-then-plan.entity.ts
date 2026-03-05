import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum IfThenTriggerType {
  LOSS_STREAK = 'loss_streak',
  OVERTRADING = 'overtrading',
  REVENGE_TRADE = 'revenge_trade',
  UNAUTHORIZED_TRADE = 'unauthorized_trade',
  PERFORMANCE_DIP = 'performance_dip',
  CUSTOM = 'custom',
}

@Entity('if_then_plans')
export class IfThenPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  accountId: string | null;

  @Column({
    type: 'enum',
    enum: IfThenTriggerType,
    default: IfThenTriggerType.CUSTOM,
  })
  triggerType: IfThenTriggerType;

  @Column({ length: 220 })
  ifCue: string;

  @Column({ type: 'text' })
  thenAction: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
