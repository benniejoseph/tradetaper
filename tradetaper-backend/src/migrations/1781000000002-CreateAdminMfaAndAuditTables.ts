import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminMfaAndAuditTables1781000000002
  implements MigrationInterface
{
  name = 'CreateAdminMfaAndAuditTables1781000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_mfa_credentials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "adminEmail" character varying(255) NOT NULL,
        "totpSecretEncrypted" text NOT NULL,
        "totpSecretIv" character varying(64) NOT NULL,
        "totpSecretAuthTag" character varying(64) NOT NULL,
        "recoveryCodeHashes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "enabled" boolean NOT NULL DEFAULT true,
        "enrolledAt" TIMESTAMP WITH TIME ZONE,
        "recoveryCodesGeneratedAt" TIMESTAMP WITH TIME ZONE,
        "lastVerifiedAt" TIMESTAMP WITH TIME ZONE,
        "lastRecoveryCodeUsedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_mfa_credentials_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_admin_mfa_credentials_adminEmail"
      ON "admin_mfa_credentials" ("adminEmail")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_auth_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "eventType" character varying(64) NOT NULL,
        "outcome" character varying(16) NOT NULL,
        "adminEmail" character varying(255),
        "ipAddress" character varying(64),
        "userAgent" character varying(255),
        "reason" character varying(128),
        "requestId" character varying(128),
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_auth_audit_logs_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_auth_audit_logs_createdAt"
      ON "admin_auth_audit_logs" ("createdAt")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_auth_audit_logs_eventType"
      ON "admin_auth_audit_logs" ("eventType")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_auth_audit_logs_outcome"
      ON "admin_auth_audit_logs" ("outcome")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_admin_auth_audit_logs_adminEmail"
      ON "admin_auth_audit_logs" ("adminEmail")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_admin_auth_audit_logs_adminEmail"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_admin_auth_audit_logs_outcome"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_admin_auth_audit_logs_eventType"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_admin_auth_audit_logs_createdAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_auth_audit_logs"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_admin_mfa_credentials_adminEmail"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_mfa_credentials"`);
  }
}
