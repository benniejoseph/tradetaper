import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBacktestChartLayouts1783200000000
  implements MigrationInterface
{
  name = 'CreateBacktestChartLayouts1783200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "backtest_chart_layouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "sessionId" uuid NOT NULL, "layout" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_backtest_chart_layouts_sessionId" UNIQUE ("sessionId"), CONSTRAINT "PK_backtest_chart_layouts_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_backtest_chart_layouts_userId" ON "backtest_chart_layouts" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_backtest_chart_layouts_sessionId" ON "backtest_chart_layouts" ("sessionId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "backtest_chart_layouts" ADD CONSTRAINT "FK_backtest_chart_layouts_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "backtest_chart_layouts" ADD CONSTRAINT "FK_backtest_chart_layouts_sessionId" FOREIGN KEY ("sessionId") REFERENCES "replay_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "backtest_chart_layouts" DROP CONSTRAINT "FK_backtest_chart_layouts_sessionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "backtest_chart_layouts" DROP CONSTRAINT "FK_backtest_chart_layouts_userId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_backtest_chart_layouts_sessionId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_backtest_chart_layouts_userId"`);
    await queryRunner.query(`DROP TABLE "backtest_chart_layouts"`);
  }
}
