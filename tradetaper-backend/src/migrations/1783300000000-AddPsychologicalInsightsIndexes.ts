import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPsychologicalInsightsIndexes1783300000000
  implements MigrationInterface
{
  name = 'AddPsychologicalInsightsIndexes1783300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_psych_insights_user_analysis_date
      ON psychological_insights ("userId", "analysisDate" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_psych_insights_note_analysis_date
      ON psychological_insights ("noteId", "analysisDate" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_psych_insights_user_insight_type
      ON psychological_insights ("userId", "insightType")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_psych_insights_user_sentiment
      ON psychological_insights ("userId", sentiment)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_user_account_scope
      ON notes (user_id, account_id, mt5_account_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notes_user_account_scope`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_psych_insights_user_sentiment`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_psych_insights_user_insight_type`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_psych_insights_note_analysis_date`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_psych_insights_user_analysis_date`,
    );
  }
}
