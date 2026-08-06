import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds a true idempotency key for MT5 exit-deal processing. The prior guard
 * in TradeProcessorService.processExitDeal (`status==='CLOSED' &&
 * contractSize`) is a proxy that fails open whenever contractSize wasn't
 * captured, letting a re-delivered exit deal (the EA re-sends a 1-day
 * "safety overlap" window on every sync cycle) reprocess and double-count
 * commission/swap on an already-closed trade. See trade-processor.service.ts.
 */
export class AddExternalCloseDealId1786029590000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        ALTER TABLE "trades" ADD COLUMN "externalCloseDealId" varchar(255);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "trades" DROP COLUMN IF EXISTS "externalCloseDealId";
    `);
  }
}
