import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMT5AccountIdToNote1768291474550 implements MigrationInterface {
    name = 'AddMT5AccountIdToNote1768291474550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add column if not exists (TypeORM handles this via just running the query, assuming safe if migration hasn't run)
        await queryRunner.query(`ALTER TABLE "notes" ADD "mt5_account_id" uuid`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_notes_mt5_account" FOREIGN KEY ("mt5_account_id") REFERENCES "mt5_accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_notes_mt5_account"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP COLUMN "mt5_account_id"`);
    }

}
