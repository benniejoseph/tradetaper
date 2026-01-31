// src/terminal-farm/entities/terminal-instance.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MT5Account } from '../../users/entities/mt5-account.entity';

export enum TerminalStatus {
  PENDING = 'PENDING',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  STOPPING = 'STOPPING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
}

@Entity('terminal_instances')
export class TerminalInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, length: 100 })
  containerId: string;

  @Column({
    type: 'enum',
    enum: TerminalStatus,
    default: TerminalStatus.PENDING,
  })
  status: TerminalStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeat: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'int', nullable: true })
  terminalPort: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => MT5Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account: MT5Account;

  @Index({ unique: true })
  @Column()
  accountId: string;
}
