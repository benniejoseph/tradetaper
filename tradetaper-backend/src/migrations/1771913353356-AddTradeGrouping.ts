import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTradeGrouping1771913353356 implements MigrationInterface {
    name = 'AddTradeGrouping1771913353356'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trades" ADD "groupId" uuid`);
        await queryRunner.query(`ALTER TABLE "trades" ADD "isGroupLeader" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."trades_emotionbefore_enum" RENAME TO "trades_emotionbefore_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."trades_emotionbefore_enum" AS ENUM('Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'Frustrated', 'Overconfident', 'Impatient', 'FOMO', 'Revenge Trading', 'Bored', 'Fatigued', 'Excited', 'Nervous', 'Hopeful', 'Disappointed', 'Relieved', 'Overwhelmed', 'Hesitant', 'Rushed', 'Distracted', 'Focused')`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "emotionBefore" TYPE "public"."trades_emotionbefore_enum" USING "emotionBefore"::"text"::"public"."trades_emotionbefore_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trades_emotionbefore_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."trades_emotionduring_enum" RENAME TO "trades_emotionduring_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."trades_emotionduring_enum" AS ENUM('Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'Frustrated', 'Overconfident', 'Impatient', 'FOMO', 'Revenge Trading', 'Bored', 'Fatigued', 'Excited', 'Nervous', 'Hopeful', 'Disappointed', 'Relieved', 'Overwhelmed', 'Hesitant', 'Rushed', 'Distracted', 'Focused')`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "emotionDuring" TYPE "public"."trades_emotionduring_enum" USING "emotionDuring"::"text"::"public"."trades_emotionduring_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trades_emotionduring_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."trades_emotionafter_enum" RENAME TO "trades_emotionafter_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."trades_emotionafter_enum" AS ENUM('Calm', 'Confident', 'Anxious', 'Fearful', 'Greedy', 'Frustrated', 'Overconfident', 'Impatient', 'FOMO', 'Revenge Trading', 'Bored', 'Fatigued', 'Excited', 'Nervous', 'Hopeful', 'Disappointed', 'Relieved', 'Overwhelmed', 'Hesitant', 'Rushed', 'Distracted', 'Focused')`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "emotionAfter" TYPE "public"."trades_emotionafter_enum" USING "emotionAfter"::"text"::"public"."trades_emotionafter_enum"`);
        await queryRunner.query(`DROP TYPE "public"."trades_emotionafter_enum_old"`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'::jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "changeLog" SET DEFAULT '[]'`);
        await queryRunner.query(`CREATE TYPE "public"."trades_emotionafter_enum_old" AS ENUM('Anxious', 'Apathetic', 'Bored', 'Calm', 'Confident', 'Disappointed', 'Excited', 'FOMO', 'Fatigued', 'Fearful', 'Frustrated', 'Greedy', 'Hesitant', 'Impatient', 'Nervous', 'Optimistic', 'Overconfident', 'Pessimistic', 'Relieved', 'Revenge Trading', 'Revenge_Trading', 'Satisfied')`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "emotionAfter" TYPE "public"."trades_emotionafter_enum_old" USING "emotionAfter"::"text"::"public"."trades_emotionafter_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."trades_emotionafter_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."trades_emotionafter_enum_old" RENAME TO "trades_emotionafter_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."trades_emotionduring_enum_old" AS ENUM('Anxious', 'Apathetic', 'Bored', 'Calm', 'Confident', 'Disappointed', 'Excited', 'FOMO', 'Fatigued', 'Fearful', 'Frustrated', 'Greedy', 'Hesitant', 'Impatient', 'Nervous', 'Optimistic', 'Overconfident', 'Pessimistic', 'Relieved', 'Revenge Trading', 'Revenge_Trading', 'Satisfied')`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "emotionDuring" TYPE "public"."trades_emotionduring_enum_old" USING "emotionDuring"::"text"::"public"."trades_emotionduring_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."trades_emotionduring_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."trades_emotionduring_enum_old" RENAME TO "trades_emotionduring_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."trades_emotionbefore_enum_old" AS ENUM('Anxious', 'Apathetic', 'Bored', 'Calm', 'Confident', 'Disappointed', 'Excited', 'FOMO', 'Fatigued', 'Fearful', 'Frustrated', 'Greedy', 'Hesitant', 'Impatient', 'Nervous', 'Optimistic', 'Overconfident', 'Pessimistic', 'Relieved', 'Revenge Trading', 'Revenge_Trading', 'Satisfied')`);
        await queryRunner.query(`ALTER TABLE "trades" ALTER COLUMN "emotionBefore" TYPE "public"."trades_emotionbefore_enum_old" USING "emotionBefore"::"text"::"public"."trades_emotionbefore_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."trades_emotionbefore_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."trades_emotionbefore_enum_old" RENAME TO "trades_emotionbefore_enum"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "isGroupLeader"`);
        await queryRunner.query(`ALTER TABLE "trades" DROP COLUMN "groupId"`);
    }

}
