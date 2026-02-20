import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEconomicEventAlerts1776000000000 implements MigrationInterface {
  name = 'CreateEconomicEventAlerts1776000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "economic_event_alerts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "eventId" character varying(128) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_economic_event_alerts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_economic_event_alerts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_economic_event_alerts_user_event"
      ON "economic_event_alerts" ("userId", "eventId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_economic_event_alerts_event"
      ON "economic_event_alerts" ("eventId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_economic_event_alerts_event"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_economic_event_alerts_user_event"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "economic_event_alerts"`);
  }
}
