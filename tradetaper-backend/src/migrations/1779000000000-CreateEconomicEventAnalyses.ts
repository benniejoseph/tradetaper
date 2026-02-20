import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEconomicEventAnalyses1779000000000
  implements MigrationInterface
{
  name = 'CreateEconomicEventAnalyses1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "economic_event_analyses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventId" varchar(128) NOT NULL,
        "eventKey" varchar(128),
        "currency" varchar(16),
        "importance" varchar(16),
        "eventDate" timestamptz,
        "analysis" jsonb,
        "aiSummary" jsonb,
        "confidence" numeric,
        "sourceQuality" jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_economic_event_analyses_eventId" 
      ON "economic_event_analyses" ("eventId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_economic_event_analyses_eventKey" 
      ON "economic_event_analyses" ("eventKey");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_economic_event_analyses_eventDate" 
      ON "economic_event_analyses" ("eventDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_economic_event_analyses_eventDate";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_economic_event_analyses_eventKey";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_economic_event_analyses_eventId";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "economic_event_analyses";`);
  }
}
