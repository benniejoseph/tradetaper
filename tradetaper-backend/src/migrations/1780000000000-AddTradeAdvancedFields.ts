import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTradeAdvancedFields1780000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Create enum types (IF NOT EXISTS) ──────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "emotional_state_enum" AS ENUM (
          'Calm','Confident','Anxious','Fearful','Greedy',
          'Frustrated','Overconfident','Impatient','FOMO',
          'Revenge Trading','Bored','Fatigued'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "execution_grade_enum" AS ENUM ('A','B','C','D','F');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "market_condition_enum" AS ENUM (
          'Trending Up','Trending Down','Ranging','Choppy',
          'High Volatility','Low Volatility','News Driven','Pre-News'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "htf_bias_enum" AS ENUM ('Bullish','Bearish','Neutral');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "timeframe_enum" AS ENUM (
          '1m','5m','15m','30m','1H','4H','1D','1W','1M'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ── Helper: add column only if it doesn't already exist ───
    const addCol = async (
      col: string,
      type: string,
      extra = '',
    ) => {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TABLE "trade" ADD COLUMN "${col}" ${type} ${extra};
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
      `);
    };

    // Phase 1 – Psychology & Emotion
    await addCol('emotionBefore', 'emotional_state_enum');
    await addCol('emotionDuring', 'emotional_state_enum');
    await addCol('emotionAfter',  'emotional_state_enum');
    await addCol('confidenceLevel', 'integer');
    await addCol('followedPlan', 'boolean');
    await addCol('ruleViolations', 'text'); // simple-array stored as comma-separated text

    // Phase 2 – Performance Metrics
    await addCol('plannedRR',  'decimal(10,4)');
    await addCol('maePrice',   'decimal(19,8)');
    await addCol('mfePrice',   'decimal(19,8)');
    await addCol('maePips',    'decimal(10,2)');
    await addCol('mfePips',    'decimal(10,2)');
    await addCol('slippage',   'decimal(10,2)');
    await addCol('executionGrade', 'execution_grade_enum');

    // Phase 3 – Market Context
    await addCol('marketCondition', 'market_condition_enum');
    await addCol('timeframe',  'timeframe_enum');
    await addCol('htfBias',    'htf_bias_enum');
    await addCol('newsImpact', 'boolean');

    // Phase 4 – Pre-Trade Checklist
    await addCol('entryReason',   'text');
    await addCol('confirmations', 'text'); // simple-array
    await addCol('hesitated',     'boolean');
    await addCol('preparedToLose','boolean');

    // Phase 5 – Environmental Factors
    await addCol('sleepQuality',      'integer');
    await addCol('energyLevel',       'integer');
    await addCol('distractionLevel',  'integer');
    await addCol('tradingEnvironment','varchar(100)');

    // Change log & sync source
    await addCol('changeLog',  "jsonb DEFAULT '[]'::jsonb");
    await addCol('syncSource', "varchar(20) DEFAULT 'manual'");

    // Strategy link
    await addCol('strategyId', 'uuid');

    // Execution candles
    await addCol('executionCandles', 'jsonb');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = [
      'emotionBefore','emotionDuring','emotionAfter','confidenceLevel',
      'followedPlan','ruleViolations','plannedRR','maePrice','mfePrice',
      'maePips','mfePips','slippage','executionGrade','marketCondition',
      'timeframe','htfBias','newsImpact','entryReason','confirmations',
      'hesitated','preparedToLose','sleepQuality','energyLevel',
      'distractionLevel','tradingEnvironment','changeLog','syncSource',
      'strategyId','executionCandles',
    ];

    for (const col of cols) {
      await queryRunner.query(`
        ALTER TABLE "trade" DROP COLUMN IF EXISTS "${col}";
      `);
    }

    await queryRunner.query(`DROP TYPE IF EXISTS "emotional_state_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "execution_grade_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "market_condition_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "htf_bias_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "timeframe_enum"`);
  }
}
