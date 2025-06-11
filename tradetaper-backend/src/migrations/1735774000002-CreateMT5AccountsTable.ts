import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateMT5AccountsTable1735774000002 implements MigrationInterface {
  name = 'CreateMT5AccountsTable1735774000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create mt5_accounts table
    await queryRunner.createTable(
      new Table({
        name: 'mt5_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'accountName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'server',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'login',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: 'true',
            isNullable: false,
          },
          {
            name: 'balance',
            type: 'decimal',
            precision: 19,
            scale: 2,
            default: '0',
            isNullable: false,
          },
          {
            name: 'accountType',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '3',
            default: "'USD'",
            isNullable: true,
          },
          {
            name: 'lastSyncAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'syncAttempts',
            type: 'integer',
            default: '0',
            isNullable: false,
          },
          {
            name: 'lastSyncErrorAt',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'lastSyncError',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'totalTradesImported',
            type: 'integer',
            default: '0',
            isNullable: false,
          },
          {
            name: 'autoSyncEnabled',
            type: 'boolean',
            default: 'true',
            isNullable: false,
          },
          {
            name: 'lastKnownIp',
            type: 'varchar',
            length: '45', // Support IPv6
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indices for better performance
    await queryRunner.createIndex(
      'mt5_accounts',
      new Index('IDX_mt5_accounts_userId', ['userId']),
    );

    await queryRunner.createIndex(
      'mt5_accounts',
      new Index('IDX_mt5_accounts_server_login', ['server', 'login']),
    );

    await queryRunner.createIndex(
      'mt5_accounts',
      new Index('IDX_mt5_accounts_isActive', ['isActive']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mt5_accounts');
  }
}