import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthSessionsTable1781000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "auth_sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(128) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revokedAt" TIMESTAMP WITH TIME ZONE,
        "replacedBySessionId" uuid,
        "lastUsedAt" TIMESTAMP WITH TIME ZONE,
        "userAgent" character varying(255),
        "ipAddress" character varying(64),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_auth_sessions_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_userId"
      ON "auth_sessions" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_expiresAt"
      ON "auth_sessions" ("expiresAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_revokedAt"
      ON "auth_sessions" ("revokedAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_revokedAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_expiresAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_auth_sessions_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "auth_sessions"`);
  }
}
