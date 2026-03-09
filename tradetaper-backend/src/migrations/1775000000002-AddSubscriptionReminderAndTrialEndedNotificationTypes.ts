import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubscriptionReminderAndTrialEndedNotificationTypes1775000000002
  implements MigrationInterface
{
  name =
    'AddSubscriptionReminderAndTrialEndedNotificationTypes1775000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
          EXECUTE 'ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS ''subscription_reminder''';
          EXECUTE 'ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS ''trial_ended''';
        ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_type_enum') THEN
          EXECUTE 'ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS ''subscription_reminder''';
          EXECUTE 'ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS ''trial_ended''';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      UPDATE "notification_preferences"
      SET "channelPreferences" = jsonb_set(
        jsonb_set(
          COALESCE("channelPreferences", '{}'::jsonb),
          '{subscription_reminder}',
          '{"inApp":true,"push":true,"email":true}'::jsonb,
          true
        ),
        '{trial_ended}',
        '{"inApp":true,"push":true,"email":true}'::jsonb,
        true
      )
    `);
  }

  public async down(): Promise<void> {
    // Postgres enums do not support removing individual values safely.
  }
}
