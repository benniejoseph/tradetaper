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
import { User } from './user.entity';

@Entity('mt5_accounts')
export class MT5Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  accountName: string;

  @Column({ length: 255 })
  server: string;

  @Column({ length: 255 })
  login: string;

  @Column({ length: 255, select: false }) // Password is hidden by default for security
  password: string;

  // MetaApi specific fields
  @Column({ length: 255, nullable: true })
  metaApiAccountId: string;

  @Column({ length: 255, nullable: true })
  provisioningProfileId: string;

  @Column({ length: 50, default: 'UNDEPLOYED' })
  deploymentState: string; // UNDEPLOYED, DEPLOYING, DEPLOYED, UNDEPLOYING

  @Column({ length: 50, default: 'DISCONNECTED' })
  connectionState: string; // DISCONNECTED, CONNECTING, CONNECTED, SYNCHRONIZING, SYNCHRONIZED

  @Column({ type: 'boolean', default: false })
  isRealAccount: boolean; // true for real accounts, false for demo

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  initialBalance: number; // User-provided starting account size

  @Column({ type: 'decimal', precision: 19, scale: 2, nullable: true, default: 0 })
  target: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  equity: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  margin: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  marginFree: number;

  @Column({ type: 'decimal', precision: 19, scale: 2, default: 0 })
  profit: number;

  @Column({ type: 'int', default: 1 })
  leverage: number;

  @Column({ length: 255, nullable: true })
  accountType: string;

  @Column({ length: 3, nullable: true, default: 'USD' })
  currency: string;

  @Column({ length: 20, default: 'DISCONNECTED' })
  connectionStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt: Date;

  @Column({ type: 'int', default: 0 })
  syncAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncErrorAt: Date;

  @Column({ type: 'text', nullable: true })
  lastSyncError: string;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  metadata: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  totalTradesImported: number;

  @Column({ type: 'boolean', default: true })
  autoSyncEnabled: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  lastKnownIp: string;

  // MetaApi connection and sync status
  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeatAt: Date;

  @Column({ type: 'boolean', default: false })
  isStreamingActive: boolean;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  accountInfo: Record<string, any>; // Store complete MetaApi account info

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string; // MetaApi server region

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
