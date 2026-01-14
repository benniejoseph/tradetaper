import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTables1768400000000
  implements MigrationInterface
{
  name = 'CreateNotificationsTables1768400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'trade_created',
        'trade_updated',
        'trade_closed',
        'mt5_sync_complete',
        'mt5_sync_error',
        'economic_event_1h',
        'economic_event_15m',
        'economic_event_now',
        'ai_insight',
        'strategy_alert',
        'system_update',
        'subscription_expiry',
        'subscription_renewed',
        'account_linked',
        'account_unlinked'
      )
    `);

    // Create notification_channel enum
    await queryRunner.query(`
      CREATE TYPE "notification_channel_enum" AS ENUM (
        'in_app',
        'push',
        'email'
      )
    `);

    // Create notification_priority enum
    await queryRunner.query(`
      CREATE TYPE "notification_priority_enum" AS ENUM (
        'low',
        'normal',
        'high',
        'urgent'
      )
    `);

    // Create notification_status enum
    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM (
        'pending',
        'delivered',
        'read',
        'failed'
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" character varying(255) NOT NULL,
        "message" text NOT NULL,
        "channel" "notification_channel_enum" NOT NULL DEFAULT 'in_app',
        "priority" "notification_priority_enum" NOT NULL DEFAULT 'normal',
        "status" "notification_status_enum" NOT NULL DEFAULT 'pending',
        "data" jsonb,
        "resourceType" character varying,
        "resourceId" character varying,
        "actionUrl" character varying,
        "icon" character varying,
        "scheduledFor" TIMESTAMP,
        "sentAt" TIMESTAMP,
        "readAt" TIMESTAMP,
        "errorMessage" text,
        "retryCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for notifications
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_status" ON "notifications" ("userId", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId_createdAt" ON "notifications" ("userId", "createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_scheduledFor" ON "notifications" ("scheduledFor")
    `);

    // Create notification_preferences table
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "channelPreferences" jsonb NOT NULL DEFAULT '{
          "trade_created": {"inApp": true, "push": false, "email": false},
          "trade_updated": {"inApp": true, "push": false, "email": false},
          "trade_closed": {"inApp": true, "push": false, "email": false},
          "mt5_sync_complete": {"inApp": true, "push": false, "email": false},
          "mt5_sync_error": {"inApp": true, "push": true, "email": false},
          "economic_event_1h": {"inApp": true, "push": true, "email": false},
          "economic_event_15m": {"inApp": true, "push": true, "email": false},
          "economic_event_now": {"inApp": true, "push": true, "email": false},
          "ai_insight": {"inApp": true, "push": false, "email": false},
          "strategy_alert": {"inApp": true, "push": true, "email": false},
          "system_update": {"inApp": true, "push": false, "email": false},
          "subscription_expiry": {"inApp": true, "push": true, "email": true},
          "subscription_renewed": {"inApp": true, "push": true, "email": true},
          "account_linked": {"inApp": true, "push": false, "email": false},
          "account_unlinked": {"inApp": true, "push": false, "email": false}
        }'::jsonb,
        "economicAlert1h" boolean NOT NULL DEFAULT true,
        "economicAlert15m" boolean NOT NULL DEFAULT true,
        "economicAlertNow" boolean NOT NULL DEFAULT false,
        "economicEventImportance" character varying NOT NULL DEFAULT 'high,medium',
        "economicEventCurrencies" character varying,
        "quietHoursEnabled" boolean NOT NULL DEFAULT false,
        "quietHoursStart" time,
        "quietHoursEnd" time,
        "timezone" character varying,
        "dailyDigestEnabled" boolean NOT NULL DEFAULT false,
        "dailyDigestTime" time,
        "pushToken" character varying,
        "emailEnabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_preferences_userId" UNIQUE ("userId"),
        CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_preferences"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);

    // Drop indexes (handled by table drop)

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
  }
}
