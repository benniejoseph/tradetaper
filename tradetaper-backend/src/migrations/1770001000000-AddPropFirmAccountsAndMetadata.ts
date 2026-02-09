import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropFirmAccountsAndMetadata1770001000000
  implements MigrationInterface
{
  name = 'AddPropFirmAccountsAndMetadata1770001000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add metadata column to trade_approvals
    await queryRunner.query(`
      ALTER TABLE "trade_approvals" 
      ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'
    `);

    // Create prop_firm_accounts table
    await queryRunner.query(`
      CREATE TYPE "prop_firm_phase_enum" AS ENUM ('evaluation', 'verification', 'funded')
    `);

    await queryRunner.query(`
      CREATE TABLE "prop_firm_accounts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "accountId" character varying NOT NULL,
        "firmName" character varying(100) NOT NULL,
        "phase" "prop_firm_phase_enum" NOT NULL DEFAULT 'evaluation',
        "startingBalance" numeric(15,2) NOT NULL,
        "currentBalance" numeric(15,2) NOT NULL,
        "dailyPnL" numeric(15,2) NOT NULL DEFAULT 0,
        "dailyPnLDate" date NOT NULL DEFAULT CURRENT_DATE,
        "totalPnL" numeric(15,2) NOT NULL DEFAULT 0,
        "rules" jsonb NOT NULL DEFAULT '{}',
        "dailyDrawdownUsed" numeric(5,2) NOT NULL DEFAULT 0,
        "totalDrawdownUsed" numeric(5,2) NOT NULL DEFAULT 0,
        "tradingDaysCount" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "isPassed" boolean NOT NULL DEFAULT false,
        "isFailed" boolean NOT NULL DEFAULT false,
        "failureReason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "idx_prop_firm_user" ON "prop_firm_accounts" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_prop_firm_account" ON "prop_firm_accounts" ("accountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_prop_firm_active" ON "prop_firm_accounts" ("userId", "isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_prop_firm_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_prop_firm_account"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_prop_firm_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prop_firm_accounts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "prop_firm_phase_enum"`);
    await queryRunner.query(
      `ALTER TABLE "trade_approvals" DROP COLUMN IF EXISTS "metadata"`,
    );
  }
}
