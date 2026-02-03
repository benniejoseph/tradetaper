import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisciplineTables1770000000000 implements MigrationInterface {
  name = 'CreateDisciplineTables1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create trade_approvals table
    await queryRunner.query(`
      CREATE TYPE "public"."trade_approvals_status_enum" AS ENUM('pending', 'approved', 'executed', 'expired', 'rejected')
    `);

    await queryRunner.query(`
      CREATE TABLE "trade_approvals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "accountId" character varying,
        "strategyId" character varying,
        "symbol" character varying(20) NOT NULL,
        "direction" character varying(10) NOT NULL,
        "checklistResponses" jsonb NOT NULL DEFAULT '[]',
        "riskPercent" numeric(5,2) NOT NULL DEFAULT '1',
        "calculatedLotSize" numeric(10,4),
        "stopLoss" numeric(15,5),
        "takeProfit" numeric(15,5),
        "status" "public"."trade_approvals_status_enum" NOT NULL DEFAULT 'pending',
        "approvedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "executedTradeId" character varying,
        "rejectionReason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trade_approvals" PRIMARY KEY ("id")
      )
    `);

    // Create trader_discipline table
    await queryRunner.query(`
      CREATE TABLE "trader_discipline" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "xpTotal" integer NOT NULL DEFAULT '0',
        "level" integer NOT NULL DEFAULT '1',
        "currentStreak" integer NOT NULL DEFAULT '0',
        "longestStreak" integer NOT NULL DEFAULT '0',
        "disciplineScore" numeric(5,2) NOT NULL DEFAULT '100',
        "totalApprovedTrades" integer NOT NULL DEFAULT '0',
        "totalExecutedTrades" integer NOT NULL DEFAULT '0',
        "totalRuleViolations" integer NOT NULL DEFAULT '0',
        "totalUnauthorizedTrades" integer NOT NULL DEFAULT '0',
        "badges" jsonb NOT NULL DEFAULT '[]',
        "dailyStats" jsonb NOT NULL DEFAULT '{}',
        "lastTradeAt" TIMESTAMP,
        "lastViolationAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trader_discipline" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_trader_discipline_userId" UNIQUE ("userId")
      )
    `);

    // Create cooldown_sessions table
    await queryRunner.query(`
      CREATE TYPE "public"."cooldown_sessions_trigger_enum" AS ENUM('loss_streak', 'overtrading', 'revenge_trade', 'unauthorized_trade', 'outside_hours', 'manual')
    `);

    await queryRunner.query(`
      CREATE TABLE "cooldown_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "triggerReason" "public"."cooldown_sessions_trigger_enum" NOT NULL,
        "durationMinutes" integer NOT NULL DEFAULT '15',
        "exercisesCompleted" jsonb NOT NULL DEFAULT '[]',
        "requiredExercises" jsonb NOT NULL DEFAULT '[]',
        "isCompleted" boolean NOT NULL DEFAULT false,
        "isSkipped" boolean NOT NULL DEFAULT false,
        "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "notes" text,
        CONSTRAINT "PK_cooldown_sessions" PRIMARY KEY ("id")
      )
    `);

    // Add maxRiskPercent to strategies table
    await queryRunner.query(`
      ALTER TABLE "strategies" ADD COLUMN IF NOT EXISTS "maxRiskPercent" numeric(5,2) DEFAULT '1'
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX "IDX_trade_approvals_userId" ON "trade_approvals" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_trade_approvals_status" ON "trade_approvals" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_cooldown_sessions_userId" ON "cooldown_sessions" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_cooldown_sessions_isCompleted" ON "cooldown_sessions" ("isCompleted")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cooldown_sessions_isCompleted"`);
    await queryRunner.query(`DROP INDEX "IDX_cooldown_sessions_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_trade_approvals_status"`);
    await queryRunner.query(`DROP INDEX "IDX_trade_approvals_userId"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "maxRiskPercent"`);
    await queryRunner.query(`DROP TABLE "cooldown_sessions"`);
    await queryRunner.query(`DROP TYPE "public"."cooldown_sessions_trigger_enum"`);
    await queryRunner.query(`DROP TABLE "trader_discipline"`);
    await queryRunner.query(`DROP TABLE "trade_approvals"`);
    await queryRunner.query(`DROP TYPE "public"."trade_approvals_status_enum"`);
  }
}
