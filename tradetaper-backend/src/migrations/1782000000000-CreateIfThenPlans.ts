import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIfThenPlans1782000000000 implements MigrationInterface {
  name = 'CreateIfThenPlans1782000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."if_then_plans_triggertype_enum" AS ENUM(
        'loss_streak',
        'overtrading',
        'revenge_trade',
        'unauthorized_trade',
        'performance_dip',
        'custom'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "if_then_plans" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" character varying NOT NULL,
        "accountId" character varying,
        "triggerType" "public"."if_then_plans_triggertype_enum" NOT NULL DEFAULT 'custom',
        "ifCue" character varying(220) NOT NULL,
        "thenAction" text NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_if_then_plans_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_if_then_plans_userId" ON "if_then_plans" ("userId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_if_then_plans_accountId" ON "if_then_plans" ("accountId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_if_then_plans_triggerType" ON "if_then_plans" ("triggerType")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_if_then_plans_isActive" ON "if_then_plans" ("isActive")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_if_then_plans_createdAt" ON "if_then_plans" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_if_then_plans_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_if_then_plans_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_if_then_plans_triggerType"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_if_then_plans_accountId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_if_then_plans_userId"`);
    await queryRunner.query(`DROP TABLE "if_then_plans"`);
    await queryRunner.query(`DROP TYPE "public"."if_then_plans_triggertype_enum"`);
  }
}
