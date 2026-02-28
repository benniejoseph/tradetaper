import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropFirmAndMt5Slots1772255000000 implements MigrationInterface {
  name = 'AddPropFirmAndMt5Slots1772255000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create prop_firm_challenges table
    await queryRunner.query(`
      CREATE TYPE "prop_firm_challenges_phase_enum" AS ENUM (
        'challenge', 'verification', 'funded', 'express'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "prop_firm_challenges_status_enum" AS ENUM (
        'active', 'passed', 'failed', 'expired'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "prop_firm_challenges" (
        "id"                      uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "userId"                  uuid              NOT NULL,
        "firmName"                character varying(100) NOT NULL,
        "phase"                   "prop_firm_challenges_phase_enum" NOT NULL DEFAULT 'challenge',
        "accountSize"             numeric(19,2)     NOT NULL,
        "profitTargetPct"         numeric(5,2)      NOT NULL,
        "dailyDrawdownLimitPct"   numeric(5,2)      NOT NULL,
        "maxDrawdownLimitPct"     numeric(5,2)      NOT NULL,
        "startBalance"            numeric(19,2)     NOT NULL,
        "todayStartBalance"       numeric(19,2)     NOT NULL DEFAULT 0,
        "currentBalance"          numeric(19,2)     NOT NULL,
        "currentEquity"           numeric(19,2)     NOT NULL DEFAULT 0,
        "startDate"               date              NOT NULL,
        "endDate"                 date,
        "status"                  "prop_firm_challenges_status_enum" NOT NULL DEFAULT 'active',
        "platform"                character varying(50),
        "mt5AccountId"            character varying(255),
        "notes"                   text,
        "createdAt"               TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"               TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prop_firm_challenges" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_prop_firm_challenges_userId"
      ON "prop_firm_challenges" ("userId")
    `);

    // 2. Add extraMt5Slots column to subscriptions
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "extraMt5Slots" integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "extraMt5Slots"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_prop_firm_challenges_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prop_firm_challenges"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "prop_firm_challenges_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "prop_firm_challenges_phase_enum"`);
  }
}
