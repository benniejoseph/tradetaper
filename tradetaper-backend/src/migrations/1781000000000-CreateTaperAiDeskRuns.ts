import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTaperAiDeskRuns1781000000000 implements MigrationInterface {
  name = 'CreateTaperAiDeskRuns1781000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "taper_ai_desk_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "symbol" character varying(32) NOT NULL,
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "personas" text NOT NULL DEFAULT '',
        "stages" jsonb,
        "verdict" jsonb,
        "direction" character varying(8),
        "conviction" integer,
        "error" text,
        "totalTokens" integer NOT NULL DEFAULT 0,
        "totalCostUsd" numeric(10,6) NOT NULL DEFAULT 0,
        "durationMs" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "completedAt" TIMESTAMP,
        CONSTRAINT "PK_taper_ai_desk_runs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_taper_ai_desk_runs_userId" ON "taper_ai_desk_runs" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_taper_ai_desk_runs_symbol" ON "taper_ai_desk_runs" ("symbol")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "taper_ai_desk_runs"`);
  }
}
