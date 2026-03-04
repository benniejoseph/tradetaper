import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthSessionFamilyTracking1781000000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      ADD COLUMN IF NOT EXISTS "familyId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      ADD COLUMN IF NOT EXISTS "parentSessionId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      ADD COLUMN IF NOT EXISTS "revokedReason" character varying(64)
    `);

    await queryRunner.query(`
      UPDATE "auth_sessions"
      SET "familyId" = "id"
      WHERE "familyId" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "auth_sessions"
      ALTER COLUMN "familyId" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_familyId"
      ON "auth_sessions" ("familyId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_parentSessionId"
      ON "auth_sessions" ("parentSessionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_auth_sessions_parentSessionId"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_familyId"`);
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP COLUMN IF EXISTS "revokedReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP COLUMN IF EXISTS "parentSessionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP COLUMN IF EXISTS "familyId"`,
    );
  }
}
