import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReplaySessionReviewReport1785100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "replay_sessions"
      ADD COLUMN IF NOT EXISTS "reviewReport" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "replay_sessions" DROP COLUMN IF EXISTS "reviewReport"',
    );
  }
}
