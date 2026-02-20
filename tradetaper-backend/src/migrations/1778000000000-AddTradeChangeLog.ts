import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTradeChangeLog1778000000000 implements MigrationInterface {
  name = 'AddTradeChangeLog1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "changeLog" jsonb DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trades" DROP COLUMN IF EXISTS "changeLog"`,
    );
  }
}
