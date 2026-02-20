import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsernameToUsers1773000000000 implements MigrationInterface {
  name = 'AddUsernameToUsers1773000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "username" character varying(30)
    `);

    await queryRunner.query(`
      WITH raw AS (
        SELECT
          id,
          COALESCE(NULLIF(regexp_replace(lower(split_part(email,'@',1)),'[^a-z0-9_]', '', 'g'), ''), 'trader') AS base,
          "createdAt"
        FROM users
        WHERE "username" IS NULL
      ),
      normalized AS (
        SELECT
          id,
          CASE WHEN base ~ '^[a-z]' THEN base ELSE 'trader' || base END AS base,
          row_number() OVER (
            PARTITION BY CASE WHEN base ~ '^[a-z]' THEN base ELSE 'trader' || base END
            ORDER BY "createdAt"
          ) AS rn
        FROM raw
      )
      UPDATE users
      SET "username" = left(
        CASE WHEN normalized.rn = 1 THEN normalized.base ELSE normalized.base || normalized.rn END,
        20
      )
      FROM normalized
      WHERE users.id = normalized.id
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "username" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_username_lower"
      ON "users" (LOWER("username"))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_username_lower"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`);
  }
}
