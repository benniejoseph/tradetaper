import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountCategoryAndPropRules1785200000000
  implements MigrationInterface
{
  name = 'AddAccountCategoryAndPropRules1785200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "accountCategory" varchar(20) NOT NULL DEFAULT 'personal'
    `);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "propFirmPhase" varchar(50)
    `);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "propMaxLoss" numeric(19,2)
    `);

    await queryRunner.query(`
      ALTER TABLE "accounts"
      ADD COLUMN IF NOT EXISTS "propDailyMaxLoss" numeric(19,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP COLUMN IF EXISTS "propDailyMaxLoss"
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP COLUMN IF EXISTS "propMaxLoss"
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP COLUMN IF EXISTS "propFirmPhase"
    `);
    await queryRunner.query(`
      ALTER TABLE "accounts" DROP COLUMN IF EXISTS "accountCategory"
    `);
  }
}
