import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDefaultToMT5Account1772194186702 implements MigrationInterface {
    name = 'AddIsDefaultToMT5Account1772194186702'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mt5_accounts" ADD "isDefault" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "mt5_accounts" DROP COLUMN "isDefault"`);
    }

}
