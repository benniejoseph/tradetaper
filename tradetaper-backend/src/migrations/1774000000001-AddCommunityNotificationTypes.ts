import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommunityNotificationTypes1774000000001 implements MigrationInterface {
  name = 'AddCommunityNotificationTypes1774000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type_enum') THEN
          EXECUTE 'ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS ''community_post''';
          EXECUTE 'ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS ''community_mention''';
          EXECUTE 'ALTER TYPE "notification_type_enum" ADD VALUE IF NOT EXISTS ''community_reply''';
        ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notifications_type_enum') THEN
          EXECUTE 'ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS ''community_post''';
          EXECUTE 'ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS ''community_mention''';
          EXECUTE 'ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS ''community_reply''';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Postgres enums cannot easily remove values without recreation.
  }
}
