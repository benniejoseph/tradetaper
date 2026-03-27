import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillAndUniqMt5Fingerprint1785300000000
  implements MigrationInterface
{
  name = 'BackfillAndUniqMt5Fingerprint1785300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "mt5_accounts"
      SET "loginServerFingerprint" = CASE
        WHEN char_length("metadata"->>'loginServerFingerprint') = 64
          THEN "metadata"->>'loginServerFingerprint'
        ELSE NULL
      END
      WHERE "loginServerFingerprint" IS NULL
        AND "metadata" ? 'loginServerFingerprint'
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          "id",
          row_number() OVER (
            PARTITION BY "userId", "loginServerFingerprint"
            ORDER BY "createdAt" ASC, "id" ASC
          ) AS rn
        FROM "mt5_accounts"
        WHERE "loginServerFingerprint" IS NOT NULL
      )
      UPDATE "mt5_accounts" AS account
      SET
        "loginServerFingerprint" = NULL,
        "metadata" = COALESCE(account."metadata", '{}'::jsonb) - 'loginServerFingerprint'
      FROM ranked
      WHERE account."id" = ranked."id"
        AND ranked.rn > 1
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_mt5_accounts_user_fingerprint_unique"
      ON "mt5_accounts" ("userId", "loginServerFingerprint")
      WHERE "loginServerFingerprint" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mt5_accounts_user_fingerprint_unique"
    `);
  }
}

