import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCotWeeklyReport1772038598161 implements MigrationInterface {
    name = 'CreateCotWeeklyReport1772038598161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "cot_weekly_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" character varying(128) NOT NULL, "cftcContractName" character varying(128) NOT NULL, "reportDate" TIMESTAMP WITH TIME ZONE NOT NULL, "data" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2c543d911ff8f6c68bcf1b186b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_502cd7bd577b72da52a03bd96e" ON "cot_weekly_reports" ("symbol", "reportDate") `);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'`);
        await queryRunner.query(`DROP INDEX "public"."IDX_502cd7bd577b72da52a03bd96e"`);
        await queryRunner.query(`DROP TABLE "cot_weekly_reports"`);
    }

}
