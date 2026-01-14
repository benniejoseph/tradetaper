import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTargetToMt5Accounts1768000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("mt5_accounts", new TableColumn({
            name: "target",
            type: "decimal",
            precision: 19,
            scale: 2,
            default: 0,
            isNullable: true // Allow null, but default to 0
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("mt5_accounts", "target");
    }
}
