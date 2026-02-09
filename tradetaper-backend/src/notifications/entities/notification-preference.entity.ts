import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NotificationType } from './notification.entity';

// Channel preferences for each notification type
export interface ChannelPreference {
  inApp: boolean;
  push: boolean;
  email: boolean;
}

// Default preferences
const DEFAULT_CHANNEL_PREFERENCE: ChannelPreference = {
  inApp: true,
  push: false,
  email: false,
};

const HIGH_PRIORITY_PREFERENCE: ChannelPreference = {
  inApp: true,
  push: true,
  email: false,
};

const EMAIL_PREFERENCE: ChannelPreference = {
  inApp: true,
  push: true,
  email: true,
};

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Master toggle
  @Column({ default: true })
  enabled: boolean;

  // Channel preferences per notification type (stored as JSONB)
  @Column({
    type: 'jsonb',
    default: () =>
      `'${JSON.stringify({
        // Trade notifications
        [NotificationType.TRADE_CREATED]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.TRADE_UPDATED]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.TRADE_CLOSED]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.MT5_SYNC_COMPLETE]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.MT5_SYNC_ERROR]: HIGH_PRIORITY_PREFERENCE,

        // Economic calendar - high priority
        [NotificationType.ECONOMIC_EVENT_1H]: HIGH_PRIORITY_PREFERENCE,
        [NotificationType.ECONOMIC_EVENT_15M]: HIGH_PRIORITY_PREFERENCE,
        [NotificationType.ECONOMIC_EVENT_NOW]: HIGH_PRIORITY_PREFERENCE,

        // AI & Strategy
        [NotificationType.AI_INSIGHT]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.STRATEGY_ALERT]: HIGH_PRIORITY_PREFERENCE,

        // System
        [NotificationType.SYSTEM_UPDATE]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.SUBSCRIPTION_EXPIRY]: EMAIL_PREFERENCE,
        [NotificationType.SUBSCRIPTION_RENEWED]: EMAIL_PREFERENCE,

        // Account
        [NotificationType.ACCOUNT_LINKED]: DEFAULT_CHANNEL_PREFERENCE,
        [NotificationType.ACCOUNT_UNLINKED]: DEFAULT_CHANNEL_PREFERENCE,
      })}'`,
  })
  channelPreferences: Record<NotificationType, ChannelPreference>;

  // Economic event alert settings
  @Column({ default: true })
  economicAlert1h: boolean; // Alert 1 hour before

  @Column({ default: true })
  economicAlert15m: boolean; // Alert 15 minutes before

  @Column({ default: false })
  economicAlertNow: boolean; // Alert when event starts

  // Economic event importance filter
  @Column({ type: 'simple-array', default: 'high,medium' })
  economicEventImportance: string[]; // ['high', 'medium', 'low']

  // Currency filter for economic events
  @Column({ type: 'simple-array', nullable: true })
  economicEventCurrencies?: string[]; // ['USD', 'EUR', 'GBP'] - null means all

  // Quiet hours (don't send push/email during these hours)
  @Column({ default: false })
  quietHoursEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  quietHoursStart?: string; // '22:00'

  @Column({ type: 'time', nullable: true })
  quietHoursEnd?: string; // '08:00'

  @Column({ nullable: true })
  timezone?: string; // 'Asia/Kolkata'

  // Daily digest instead of real-time
  @Column({ default: false })
  dailyDigestEnabled: boolean;

  @Column({ type: 'time', nullable: true })
  dailyDigestTime?: string; // '09:00'

  // Push notification token (FCM)
  @Column({ nullable: true })
  pushToken?: string;

  // Email preferences
  @Column({ default: true })
  emailEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
