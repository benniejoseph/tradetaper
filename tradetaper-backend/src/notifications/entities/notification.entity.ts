import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  // Trade notifications
  TRADE_CREATED = 'trade_created',
  TRADE_UPDATED = 'trade_updated',
  TRADE_CLOSED = 'trade_closed',
  MT5_SYNC_COMPLETE = 'mt5_sync_complete',
  MT5_SYNC_ERROR = 'mt5_sync_error',

  // Economic calendar notifications
  ECONOMIC_EVENT_1H = 'economic_event_1h',
  ECONOMIC_EVENT_15M = 'economic_event_15m',
  ECONOMIC_EVENT_NOW = 'economic_event_now',

  // AI & Strategy notifications
  AI_INSIGHT = 'ai_insight',
  STRATEGY_ALERT = 'strategy_alert',

  // System notifications
  SYSTEM_UPDATE = 'system_update',
  SUBSCRIPTION_EXPIRY = 'subscription_expiry',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',

  // Account notifications
  ACCOUNT_LINKED = 'account_linked',
  ACCOUNT_UNLINKED = 'account_unlinked',

  // Community notifications
  COMMUNITY_POST = 'community_post',
  COMMUNITY_MENTION = 'community_mention',
  COMMUNITY_REPLY = 'community_reply',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
@Index(['scheduledFor'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  // JSON data for additional context (trade details, event info, etc.)
  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  // For linking to specific resources
  @Column({ nullable: true })
  resourceType?: string; // 'trade', 'economic_event', 'strategy', etc.

  @Column({ nullable: true })
  resourceId?: string;

  // Action URL for clicking the notification
  @Column({ nullable: true })
  actionUrl?: string;

  // Icon for the notification
  @Column({ nullable: true })
  icon?: string;

  // Scheduling
  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  // Error tracking for failed notifications
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
