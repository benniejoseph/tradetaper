import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTradeCandles1769000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const tableExists = await queryRunner.hasTable('trade_candles');
    
    if (!tableExists) {
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
    }

    // Check if foreign key already exists
    const table = await queryRunner.getTable('trade_candles');
    const hasForeignKey = table?.foreignKeys.some(fk => fk.columnNames.includes('tradeId'));
    
    if (!hasForeignKey) {
      await queryRunner.createForeignKey(
        'trade_candles',
        new TableForeignKey({
          columnNames: ['tradeId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'trades',
          onDelete: 'CASCADE',
        }),
      );
    }

    // Check if index already exists
    const hasIndex = table?.indices.some(idx => idx.name === 'IDX_trade_candles_trade_timeframe');
    
    if (!hasIndex) {
      await queryRunner.createIndex(
        'trade_candles',
        new TableIndex({
          name: 'IDX_trade_candles_trade_timeframe',
          columnNames: ['tradeId', 'timeframe'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('trade_candles');
    if (tableExists) {
      await queryRunner.dropTable('trade_candles');
    }
  }
}
