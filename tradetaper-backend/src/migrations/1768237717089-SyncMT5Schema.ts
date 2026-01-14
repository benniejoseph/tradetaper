import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncMT5Schema1768237717089 implements MigrationInterface {
    name = 'SyncMT5Schema1768237717089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mt5_accounts" ADD "initialBalance" numeric(19,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mt5_accounts" DROP COLUMN "initialBalance"`);
    }

}
