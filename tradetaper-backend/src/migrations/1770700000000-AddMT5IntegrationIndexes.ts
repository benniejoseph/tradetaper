import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMT5IntegrationIndexes1770700000000
  implements MigrationInterface
{
  name = 'AddMT5IntegrationIndexes1770700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index on trades.externalId for position-based lookup
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trades_userId_externalId" ON "trades" ("userId", "externalId")`,
    );

    // Add index on trades.accountId for account filtering
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trades_userId_accountId" ON "trades" ("userId", "accountId")`,
    );

    // Add composite index for duplicate detection
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trades_userId_symbol_openTime" ON "trades" ("userId", "symbol", "openTime")`,
    );

    // Add index on trades.status for filtering open/closed trades
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_trades_userId_status" ON "trades" ("userId", "status")`,
    );

    // Add index on terminal_instances.lastHeartbeat for health monitoring
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_terminal_instances_lastHeartbeat" ON "terminal_instances" ("lastHeartbeat")`,
    );

    // Add index on terminal_instances.status for filtering active terminals
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_terminal_instances_status" ON "terminal_instances" ("status")`,
    );

    // Add index on mt5_accounts.userId for faster user account lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_mt5_accounts_userId_isActive" ON "mt5_accounts" ("userId", "isActive")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_trades_userId_externalId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_trades_userId_accountId"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_trades_userId_symbol_openTime"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_trades_userId_status"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_terminal_instances_lastHeartbeat"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_terminal_instances_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_mt5_accounts_userId_isActive"`,
    );
  }
}
