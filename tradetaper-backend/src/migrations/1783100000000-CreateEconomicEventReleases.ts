import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEconomicEventReleases1783100000000
  implements MigrationInterface
{
  name = 'CreateEconomicEventReleases1783100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "economic_event_releases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventId" varchar(160) NOT NULL,
        "eventKey" varchar(180) NOT NULL,
        "title" varchar(255) NOT NULL,
        "country" varchar(64),
        "currency" varchar(16),
        "importance" varchar(16),
        "eventDate" timestamptz NOT NULL,
        "releaseStatus" varchar(32) NOT NULL DEFAULT 'upcoming',
        "actual" varchar(64),
        "forecast" varchar(64),
        "previous" varchar(64),
        "revised" varchar(64),
        "actualNumeric" numeric,
        "forecastNumeric" numeric,
        "previousNumeric" numeric,
        "surpriseNumeric" numeric,
        "surprisePercent" numeric,
        "source" varchar(64),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_economic_event_releases_event_key_date"
      ON "economic_event_releases" ("eventKey", "eventDate");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_economic_event_releases_event_id"
      ON "economic_event_releases" ("eventId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_economic_event_releases_currency"
      ON "economic_event_releases" ("currency");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_economic_event_releases_event_date"
      ON "economic_event_releases" ("eventDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_economic_event_releases_event_date";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_economic_event_releases_currency";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_economic_event_releases_event_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_economic_event_releases_event_key_date";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "economic_event_releases";`);
  }
}
