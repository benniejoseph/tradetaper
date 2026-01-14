import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTradeExternalIds1768240472639 implements MigrationInterface {
    name = 'AddTradeExternalIds1768240472639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Only run if column doesn't exist (safety check not strictly needed in pure migration but good practice conceptually)
        // But for TypeORM migration, we just list commands.
        await queryRunner.query(`ALTER TABLE "trades" ADD "externalId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "trades" ADD "externalDealId" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "trades" ADD "mt5Magic" bigint`);
        await queryRunner.query(`CREATE INDEX "IDX_trades_externalId" ON "trades" ("externalId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_trades_externalId"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "mt5Magic"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "externalDealId"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "externalId"`);
    }

}
