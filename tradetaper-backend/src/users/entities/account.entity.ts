import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export type AccountCategory = 'personal' | 'prop_firm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  target: number;

  @Column({ type: 'varchar', length: 20, default: 'personal' })
  accountCategory: AccountCategory;

  @Column({ type: 'varchar', length: 50, nullable: true })
  propFirmPhase?: string | null;

  @Column({ type: 'decimal', precision: 19, scale: 2, nullable: true })
  propMaxLoss?: number | null;

  @Column({ type: 'decimal', precision: 19, scale: 2, nullable: true })
  propDailyMaxLoss?: number | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
