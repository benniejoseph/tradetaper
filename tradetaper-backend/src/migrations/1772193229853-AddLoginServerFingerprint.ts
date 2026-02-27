import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoginServerFingerprint1772193229853 implements MigrationInterface {
    name = 'AddLoginServerFingerprint1772193229853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mt5_accounts" ADD "loginServerFingerprint" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "mt5_accounts" DROP COLUMN "loginServerFingerprint"`);
    }

}
