import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMT5AccountsTable1717789011000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the table already exists
    const tableExists = await queryRunner.hasTable('mt5_accounts');
    if (!tableExists) {
      // Create table using TypeORM Table class for better reliability
      await queryRunner.createTable(
        new Table({
          name: 'mt5_accounts',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              default: 'uuid_generate_v4()',
            },
            {
              name: 'account_name',
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
              name: 'is_active',
              type: 'boolean',
              default: 'true',
              isNullable: false,
            },
            {
              name: 'balance',
              type: 'decimal',
              precision: 19,
              scale: 2,
              default: 0,
              isNullable: false,
            },
            {
              name: 'account_type',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'currency',
              type: 'varchar',
              length: '3',
              default: `'USD'`,
              isNullable: true,
            },
            {
              name: 'last_sync_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'sync_attempts',
              type: 'int',
              default: 0,
              isNullable: false,
            },
            {
              name: 'last_sync_error_at',
              type: 'timestamp with time zone',
              isNullable: true,
            },
            {
              name: 'last_sync_error',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'metadata',
              type: 'jsonb',
              default: `'{}'`,
              isNullable: true,
            },
            {
              name: 'total_trades_imported',
              type: 'int',
              default: 0,
              isNullable: false,
            },
            {
              name: 'auto_sync_enabled',
              type: 'boolean',
              default: 'true',
              isNullable: false,
            },
            {
              name: 'last_known_ip',
              type: 'varchar',
              length: '20',
              isNullable: true,
            },
            {
              name: 'user_id',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              default: 'now()',
              isNullable: false,
            },
            {
              name: 'updated_at',
              type: 'timestamp with time zone',
              default: 'now()',
              isNullable: false,
            },
          ],
          foreignKeys: [
            {
              columnNames: ['user_id'],
              referencedTableName: 'users',
              referencedColumnNames: ['id'],
              onDelete: 'CASCADE',
            },
          ],
        }),
        true,
      );

      // Create indexes explicitly
      await queryRunner.createIndex(
        'mt5_accounts',
        new TableIndex({
          name: 'idx_mt5_accounts_user_id',
          columnNames: ['user_id'],
        }),
      );

      await queryRunner.createIndex(
        'mt5_accounts',
        new TableIndex({
          name: 'idx_mt5_accounts_server_login',
          columnNames: ['server', 'login'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Use TypeORM methods for dropping
    const tableExists = await queryRunner.hasTable('mt5_accounts');
    if (tableExists) {
      try {
        // Try to drop indexes - use try/catch as hasIndex isn't available in all TypeORM versions
        await queryRunner.dropIndex('mt5_accounts', 'idx_mt5_accounts_user_id');
      } catch (e) {
        // Index might not exist, continue
      }

      try {
        await queryRunner.dropIndex(
          'mt5_accounts',
          'idx_mt5_accounts_server_login',
        );
      } catch (e) {
        // Index might not exist, continue
      }

      // Then drop the table
      await queryRunner.dropTable('mt5_accounts');
    }
  }
}
