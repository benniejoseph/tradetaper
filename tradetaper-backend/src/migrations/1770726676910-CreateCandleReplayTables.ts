import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCandleReplayTables1770726676910 implements MigrationInterface {
    name = 'CreateCandleReplayTables1770726676910'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "market_candles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "symbol" character varying(20) NOT NULL, "timeframe" character varying(10) NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "open" numeric(19,8) NOT NULL, "high" numeric(19,8) NOT NULL, "low" numeric(19,8) NOT NULL, "close" numeric(19,8) NOT NULL, "volume" bigint, "source" character varying(50), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f769078ed85ffe58a663a2db560" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3a0ff1d66bc70eaf7da4c763d6" ON "market_candles" ("symbol") `);
        await queryRunner.query(`CREATE INDEX "IDX_6aeee6c68bd89a3c2c31a3e7ca" ON "market_candles" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_e83cd6c9fba3e9eba3824105f9" ON "market_candles" ("symbol", "timeframe") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b3d884c15b91962f4a52651825" ON "market_candles" ("symbol", "timeframe", "timestamp") `);
        await queryRunner.query(`CREATE TYPE "public"."replay_sessions_status_enum" AS ENUM('in_progress', 'completed', 'abandoned')`);
        await queryRunner.query(`CREATE TABLE "replay_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "symbol" character varying(20) NOT NULL, "timeframe" character varying(10) NOT NULL, "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, "startingBalance" numeric(15,2) NOT NULL DEFAULT '100000', "endingBalance" numeric(15,2), "trades" json, "totalPnl" numeric(10,2), "totalTrades" integer, "winningTrades" integer, "losingTrades" integer, "winRate" numeric(5,2), "status" "public"."replay_sessions_status_enum" NOT NULL DEFAULT 'in_progress', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4eee38f5349bc59af98b25ac422" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2b3f509a629ee036bac2204466" ON "replay_sessions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_04c8a8d39cc43408bddaa3762f" ON "replay_sessions" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_726c3db1e91355336d61c471c3" ON "replay_sessions" ("symbol") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_726c3db1e91355336d61c471c3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_04c8a8d39cc43408bddaa3762f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b3f509a629ee036bac2204466"`);
        await queryRunner.query(`DROP TABLE "replay_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."replay_sessions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3d884c15b91962f4a52651825"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e83cd6c9fba3e9eba3824105f9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6aeee6c68bd89a3c2c31a3e7ca"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a0ff1d66bc70eaf7da4c763d6"`);
        await queryRunner.query(`DROP TABLE "market_candles"`);
    }

}
