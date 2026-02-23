import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvancedEmotions1771836734055 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.commitTransaction();

        try {
            const newEmotions = [
                'Excited', 'Nervous', 'Hopeful', 'Disappointed', 'Relieved',
                'Overwhelmed', 'Hesitant', 'Rushed', 'Distracted', 'Focused'
            ];
            for (const emotion of newEmotions) {
                await queryRunner.query(`ALTER TYPE "emotional_state_enum" ADD VALUE IF NOT EXISTS '${emotion}'`);
            }
        } finally {
            await queryRunner.startTransaction();
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
