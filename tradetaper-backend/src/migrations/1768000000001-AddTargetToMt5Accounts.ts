import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTargetToMt5Accounts1768000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if column already exists before adding
    const table = await queryRunner.getTable('mt5_accounts');
    const columnExists = table?.findColumnByName('target');

    if (!columnExists) {
      await queryRunner.addColumn(
        'mt5_accounts',
        new TableColumn({
          name: 'target',
          type: 'decimal',
          precision: 19,
          scale: 2,
          default: 0,
          isNullable: true, // Allow null, but default to 0
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('mt5_accounts');
    const columnExists = table?.findColumnByName('target');

    if (columnExists) {
      await queryRunner.dropColumn('mt5_accounts', 'target');
    }
  }
}
