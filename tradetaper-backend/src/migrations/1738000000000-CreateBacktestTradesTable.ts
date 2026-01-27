import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBacktestTradesTable1738000000000 implements MigrationInterface {
  name = 'CreateBacktestTradesTable1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "timeframe_enum" AS ENUM ('M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "killzone_enum" AS ENUM ('london_open', 'ny_open', 'ny_close', 'asia_open', 'overlap', 'none');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "market_structure_enum" AS ENUM ('bullish', 'bearish', 'consolidating');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "htf_bias_enum" AS ENUM ('bullish', 'bearish', 'neutral');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "trade_outcome_enum" AS ENUM ('win', 'loss', 'breakeven');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "day_of_week_enum" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the backtest_trades table
    await queryRunner.createTable(
      new Table({
        name: 'backtest_trades',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'strategyId',
            type: 'uuid',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          // Trade Details
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'direction',
            type: 'trade_direction',
          },
          {
            name: 'entryPrice',
            type: 'decimal',
            precision: 19,
            scale: 8,
          },
          {
            name: 'exitPrice',
            type: 'decimal',
            precision: 19,
            scale: 8,
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
            name: 'lotSize',
            type: 'decimal',
            precision: 10,
            scale: 4,
            default: 1.0,
          },
          // Timing Dimensions
          {
            name: 'timeframe',
            type: 'timeframe_enum',
          },
          {
            name: 'session',
            type: 'trading_session',
            isNullable: true,
          },
          {
            name: 'killZone',
            type: 'killzone_enum',
            isNullable: true,
          },
          {
            name: 'dayOfWeek',
            type: 'day_of_week_enum',
            isNullable: true,
          },
          {
            name: 'hourOfDay',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'tradeDate',
            type: 'date',
          },
          // Setup Details
          {
            name: 'setupType',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'ictConcept',
            type: 'ict_concept',
            isNullable: true,
          },
          {
            name: 'marketStructure',
            type: 'market_structure_enum',
            isNullable: true,
          },
          {
            name: 'htfBias',
            type: 'htf_bias_enum',
            isNullable: true,
          },
          // Results
          {
            name: 'outcome',
            type: 'trade_outcome_enum',
          },
          {
            name: 'pnlPips',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'pnlDollars',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'rMultiple',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'holdingTimeMinutes',
            type: 'int',
            isNullable: true,
          },
          // Quality Metrics
          {
            name: 'entryQuality',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'executionQuality',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'followedRules',
            type: 'boolean',
            default: true,
          },
          {
            name: 'checklistScore',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          // Notes
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'screenshotUrl',
            type: 'varchar',
            length: '2048',
            isNullable: true,
          },
          {
            name: 'lessonLearned',
            type: 'text',
            isNullable: true,
          },
          // Metadata
          {
            name: 'createdAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updatedAt',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['strategyId'],
            referencedTableName: 'strategies',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
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

    // Create indexes
    await queryRunner.createIndex(
      'backtest_trades',
      new TableIndex({
        name: 'IDX_backtest_strategy_user',
        columnNames: ['strategyId', 'userId'],
      }),
    );

    await queryRunner.createIndex(
      'backtest_trades',
      new TableIndex({
        name: 'IDX_backtest_symbol_session_tf',
        columnNames: ['symbol', 'session', 'timeframe'],
      }),
    );

    await queryRunner.createIndex(
      'backtest_trades',
      new TableIndex({
        name: 'IDX_backtest_trade_date',
        columnNames: ['tradeDate'],
      }),
    );

    await queryRunner.createIndex(
      'backtest_trades',
      new TableIndex({
        name: 'IDX_backtest_outcome',
        columnNames: ['outcome'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('backtest_trades', true);
    
    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "timeframe_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "killzone_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "market_structure_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "htf_bias_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "trade_outcome_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "day_of_week_enum"`);
  }
}
