import { MigrationInterface, QueryRunner } from 'typeorm';

export class PerformanceOptimization1752835720000
  implements MigrationInterface
{
  name = 'PerformanceOptimization1752835720000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ====================
    // CRITICAL PERFORMANCE INDEXES
    // ====================

    // 1. Trades Performance Optimization
    // Primary index for trade queries by user, status, and time
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_user_status_opentime 
      ON trades("userId", status, "openTime") 
      WHERE status = 'Closed'
    `);

    // Index for closed trades with close time (for analytics)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_user_closetime_desc 
      ON trades("userId", "closeTime" DESC) 
      WHERE status = 'Closed' AND "closeTime" IS NOT NULL
    `);

    // Index for trade analytics by account
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_account_status_time 
      ON trades("accountId", status, "openTime") 
      WHERE status = 'Closed' AND "accountId" IS NOT NULL
    `);

    // Index for strategy performance analysis
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_strategy_status 
      ON trades("strategyId", status, "openTime") 
      WHERE "strategyId" IS NOT NULL AND status = 'Closed'
    `);

    // 2. Notes Performance Optimization
    // Primary index for notes queries by user and update time
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_updated_desc 
      ON notes(user_id, updated_at DESC) 
      WHERE deleted_at IS NULL
    `);

    // Index for notes by account (for filtering)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_account_updated 
      ON notes(account_id, updated_at DESC) 
      WHERE account_id IS NOT NULL AND deleted_at IS NULL
    `);

    // Index for notes by trade (for trade-specific notes)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_trade_updated 
      ON notes(trade_id, updated_at DESC) 
      WHERE trade_id IS NOT NULL AND deleted_at IS NULL
    `);

    // 3. Full-Text Search Setup for Notes
    // Add search vector column for full-text search
    await queryRunner.query(`
      ALTER TABLE notes 
      ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);

    // Create GIN index for full-text search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_search_vector 
      ON notes USING gin(search_vector)
    `);

    // Update search vector for existing records
    await queryRunner.query(`
      UPDATE notes 
      SET search_vector = to_tsvector('english', 
        COALESCE(title, '') || ' ' || COALESCE(content::text, '')
      )
      WHERE search_vector IS NULL
    `);

    // Create trigger to automatically update search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_notes_search_vector() 
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', 
          COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content::text, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trig_update_notes_search_vector ON notes
    `);

    await queryRunner.query(`
      CREATE TRIGGER trig_update_notes_search_vector 
      BEFORE INSERT OR UPDATE ON notes 
      FOR EACH ROW EXECUTE FUNCTION update_notes_search_vector()
    `);

    // 4. Composite Indexes for Complex Queries
    // Index for trade analytics queries (user + time range + status)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_analytics 
      ON trades("userId", "openTime", status, "profitOrLoss") 
      WHERE status = 'Closed' AND "profitOrLoss" IS NOT NULL
    `);

    // Simple index for updated trades (without time-based WHERE clause)
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_user_updated_desc 
      ON trades("userId", "updatedAt" DESC)
    `);

    // 5. Performance-Critical Materialized Views
    // Create materialized view for user trade statistics
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS user_trade_stats AS
      SELECT 
        "userId",
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'Closed' AND "profitOrLoss" > 0) as winning_trades,
        COUNT(*) FILTER (WHERE status = 'Closed' AND "profitOrLoss" < 0) as losing_trades,
        AVG("profitOrLoss") FILTER (WHERE status = 'Closed') as avg_profit_loss,
        SUM("profitOrLoss") FILTER (WHERE status = 'Closed') as total_profit_loss,
        MAX("updatedAt") as last_trade_time
      FROM trades
      WHERE status = 'Closed'
      GROUP BY "userId"
    `);

    // Create unique index on materialized view
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_trade_stats_user 
      ON user_trade_stats("userId")
    `);

    // 6. Database-Level Optimizations
    // Set up automatic statistics collection
    await queryRunner.query(`
      ALTER TABLE trades SET (autovacuum_analyze_scale_factor = 0.05);
    `);

    await queryRunner.query(`
      ALTER TABLE notes SET (autovacuum_analyze_scale_factor = 0.05);
    `);

    // 7. Add covering indexes for frequently accessed columns
    // Index for trade list with essential fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_trades_list_covering 
      ON trades("userId", "openTime" DESC) 
      INCLUDE (symbol, status, "profitOrLoss", side)
    `);

    // Index for notes list with essential fields
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_list_covering 
      ON notes(user_id, updated_at DESC) 
      INCLUDE (title, visibility, is_pinned)
      WHERE deleted_at IS NULL
    `);

    console.log('✅ Performance optimization migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove performance optimizations in reverse order

    // Drop materialized view
    await queryRunner.query(
      `DROP MATERIALIZED VIEW IF EXISTS user_trade_stats`,
    );

    // Drop full-text search components
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trig_update_notes_search_vector ON notes`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_notes_search_vector()`,
    );
    await queryRunner.query(
      `ALTER TABLE notes DROP COLUMN IF EXISTS search_vector`,
    );

    // Drop all indexes
    const indexes = [
      'idx_trades_user_status_opentime',
      'idx_trades_user_closetime_desc',
      'idx_trades_account_status_time',
      'idx_trades_strategy_status',
      'idx_notes_user_updated_desc',
      'idx_notes_account_updated',
      'idx_notes_trade_updated',
      'idx_notes_search_vector',
      'idx_trades_analytics',
      'idx_trades_user_updated_desc',
      'idx_user_trade_stats_user',
      'idx_trades_list_covering',
      'idx_notes_list_covering',
    ];

    for (const index of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS ${index}`);
    }

    // Reset autovacuum settings
    await queryRunner.query(
      `ALTER TABLE trades RESET (autovacuum_analyze_scale_factor)`,
    );
    await queryRunner.query(
      `ALTER TABLE notes RESET (autovacuum_analyze_scale_factor)`,
    );

    console.log(
      '✅ Performance optimization migration rolled back successfully',
    );
  }
}
