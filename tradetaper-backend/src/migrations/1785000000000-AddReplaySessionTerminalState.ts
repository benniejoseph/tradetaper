import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReplaySessionTerminalState1785000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "replay_sessions"
      ADD COLUMN IF NOT EXISTS "openPositions" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "replay_sessions"
      ADD COLUMN IF NOT EXISTS "pendingOrders" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);

    await queryRunner.query(`
      ALTER TABLE "replay_sessions"
      ADD COLUMN IF NOT EXISTS "journalEntries" jsonb NOT NULL DEFAULT '[]'::jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "replay_sessions" DROP COLUMN IF EXISTS "journalEntries"',
    );
    await queryRunner.query(
      'ALTER TABLE "replay_sessions" DROP COLUMN IF EXISTS "pendingOrders"',
    );
    await queryRunner.query(
      'ALTER TABLE "replay_sessions" DROP COLUMN IF EXISTS "openPositions"',
    );
  }
}
