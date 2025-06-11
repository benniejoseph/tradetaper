import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateInitialTables1735774000001 implements MigrationInterface {
  name = 'CreateInitialTables1735774000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp with time zone',
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
      }),
      true,
    );

    // Create subscriptions table
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
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
            name: 'plan',
            type: 'varchar',
            length: '50',
            default: "'free'",
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'active'",
            isNullable: false,
          },
          {
            name: 'stripeCustomerId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'stripeSubscriptionId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'currentPeriodStart',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'currentPeriodEnd',
            type: 'timestamp with time zone',
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

    // Create usage_tracking table
    await queryRunner.createTable(
      new Table({
        name: 'usage_tracking',
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
            name: 'trades',
            type: 'integer',
            default: '0',
            isNullable: false,
          },
          {
            name: 'accounts',
            type: 'integer',
            default: '0',
            isNullable: false,
          },
          {
            name: 'periodStart',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'periodEnd',
            type: 'timestamp with time zone',
            isNullable: false,
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

    // Create unique constraint on usage_tracking
    await queryRunner.createIndex(
      'usage_tracking',
      new TableIndex({
        name: 'IDX_usage_tracking_user_period',
        columnNames: ['userId', 'periodStart'],
        isUnique: true,
      }),
    );

    // Create tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
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

    // Create strategies table
    await queryRunner.createTable(
      new Table({
        name: 'strategies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rules',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'riskProfile',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'timeframes',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'markets',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
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

    // Create trades table with corrected schema
    await queryRunner.createTable(
      new Table({
        name: 'trades',
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
            name: 'strategyId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'accountId',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'isStarred',
            type: 'boolean',
            default: 'false',
            isNullable: true,
          },
          {
            name: 'assetType',
            type: 'enum',
            enum: ['Stock', 'Crypto', 'Forex', 'Futures', 'Options'],
            default: "'Stock'",
            isNullable: false,
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'side',
            type: 'enum',
            enum: ['Long', 'Short'],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Open', 'Closed', 'Pending', 'Cancelled'],
            default: "'Open'",
            isNullable: false,
          },
          {
            name: 'openTime',
            type: 'timestamp with time zone',
            isNullable: false,
          },
          {
            name: 'openPrice',
            type: 'decimal',
            precision: 19,
            scale: 8,
            isNullable: false,
          },
          {
            name: 'closeTime',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'closePrice',
            type: 'decimal',
            precision: 19,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'quantity',
            type: 'decimal',
            precision: 19,
            scale: 8,
            isNullable: false,
          },
          {
            name: 'commission',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: '0',
            isNullable: false,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'profitOrLoss',
            type: 'decimal',
            precision: 19,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'rMultiple',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'stopLoss',
            type: 'decimal',
            precision: 19,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'takeProfit',
            type: 'decimal',
            precision: 19,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'ictConcept',
            type: 'enum',
            enum: [
              'Fair Value Gap',
              'Order Block',
              'Breaker Block',
              'Mitigation Block',
              'Liquidity Grab (BSL/SSL)',
              'Liquidity Void',
              'Silver Bullet',
              'Judas Swing',
              'SMT Divergence',
              'Power of Three (AMD)',
              'Optimal Trade Entry (OTE)',
              'Market Structure Shift (MSS)',
              'Other',
            ],
            isNullable: true,
          },
          {
            name: 'session',
            type: 'enum',
            enum: ['London', 'New York', 'Asia', 'London-NY Overlap', 'Other'],
            isNullable: true,
          },
          {
            name: 'setupDetails',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'mistakesMade',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'lessonsLearned',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '1024',
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
          {
            columnNames: ['strategyId'],
            referencedTableName: 'strategies',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );

    // Create trade_tags junction table
    await queryRunner.createTable(
      new Table({
        name: 'trade_tags',
        columns: [
          {
            name: 'tradeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tagId',
            type: 'uuid',
            isNullable: false,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['tradeId'],
            referencedTableName: 'trades',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['tagId'],
            referencedTableName: 'tags',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    // Create indices for better performance
    await queryRunner.createIndex(
      'trades',
      new TableIndex({
        name: 'IDX_trades_user_openTime',
        columnNames: ['userId', 'openTime'],
      }),
    );

    await queryRunner.createIndex(
      'trades',
      new TableIndex({
        name: 'IDX_trades_symbol',
        columnNames: ['symbol'],
      }),
    );

    await queryRunner.createIndex(
      'trades',
      new TableIndex({
        name: 'IDX_trades_status',
        columnNames: ['status'],
      }),
    );

    // Create primary key for trade_tags junction table
    await queryRunner.createIndex(
      'trade_tags',
      new TableIndex({
        name: 'PK_trade_tags',
        columnNames: ['tradeId', 'tagId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.dropTable('trade_tags');
    await queryRunner.dropTable('trades');
    await queryRunner.dropTable('strategies');
    await queryRunner.dropTable('tags');
    await queryRunner.dropTable('usage_tracking');
    await queryRunner.dropTable('subscriptions');
    await queryRunner.dropTable('users');
  }
}