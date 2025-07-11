import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTargetToAccounts1735774000004 implements MigrationInterface {
  name = 'AddTargetToAccounts1735774000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add target column to accounts table
    await queryRunner.addColumn(
      'accounts',
      new TableColumn({
        name: 'target',
        type: 'decimal',
        precision: 19,
        scale: 2,
        default: '0',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('accounts', 'target');
  }
}
