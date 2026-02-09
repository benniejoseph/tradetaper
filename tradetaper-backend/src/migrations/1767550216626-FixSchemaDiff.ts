import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSchemaDiff1767550216626 implements MigrationInterface {
  name = 'FixSchemaDiff1767550216626';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trades" ADD "marginUsed" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "trades" ALTER COLUMN "commission" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "trades" ALTER COLUMN "commission" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "trades" ALTER COLUMN "commission" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "trades" ALTER COLUMN "commission" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "marginUsed"`);
  }
}
