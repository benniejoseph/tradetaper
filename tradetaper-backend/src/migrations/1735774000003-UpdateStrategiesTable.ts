import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateStrategiesTable1735774000003 implements MigrationInterface {
  name = 'UpdateStrategiesTable1735774000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old columns that don't exist in the entity
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "rules"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "riskProfile"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "timeframes"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "markets"`);

    // Add new columns to match the entity
    await queryRunner.query(`
      ALTER TABLE "strategies" 
      ADD COLUMN IF NOT EXISTS "checklist" json,
      ADD COLUMN IF NOT EXISTS "tradingSession" varchar(50),
      ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS "color" varchar(7) DEFAULT '#3B82F6',
      ADD COLUMN IF NOT EXISTS "tags" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the new columns
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "checklist"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "tradingSession"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "isActive"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "color"`);
    await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "tags"`);

    // Re-add the old columns
    await queryRunner.query(`
      ALTER TABLE "strategies" 
      ADD COLUMN "rules" text,
      ADD COLUMN "riskProfile" varchar(50),
      ADD COLUMN "timeframes" varchar(255),
      ADD COLUMN "markets" varchar(255)
    `);
  }
} 