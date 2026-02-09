import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateTerminalInstances1770400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'terminal_instances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'containerId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: [
              'PENDING',
              'STARTING',
              'RUNNING',
              'STOPPING',
              'STOPPED',
              'ERROR',
            ],
            default: "'PENDING'",
          },
          {
            name: 'lastHeartbeat',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastSyncAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'terminalPort',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'accountId',
            type: 'uuid',
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'terminal_instances',
      new TableForeignKey({
        columnNames: ['accountId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'mt5_accounts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'terminal_instances',
      new TableIndex({
        name: 'IDX_TERMINAL_ACCOUNT',
        columnNames: ['accountId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('terminal_instances');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('accountId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('terminal_instances', foreignKey);
    }
    await queryRunner.dropTable('terminal_instances');
  }
}
