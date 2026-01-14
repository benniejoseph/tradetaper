import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTradeCandles1769000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'trade_candles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tradeId',
            type: 'uuid',
          },
          {
            name: 'symbol',
            type: 'varchar',
          },
          {
            name: 'timeframe',
            type: 'varchar',
          },
          {
            name: 'data',
            type: 'json',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'trade_candles',
      new TableForeignKey({
        columnNames: ['tradeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trades',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'trade_candles',
      new TableIndex({
        name: 'IDX_trade_candles_trade_timeframe',
        columnNames: ['tradeId', 'timeframe'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('trade_candles');
  }
}
