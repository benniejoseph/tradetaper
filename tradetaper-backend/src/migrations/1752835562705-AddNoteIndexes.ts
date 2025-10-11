import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNoteIndexes1752835562705 implements MigrationInterface {
  name = 'AddNoteIndexes1752835562705';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_notes_userId_updatedAt" ON "notes" ("user_id", "updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notes_tags_gin" ON "notes" USING GIN ("tags")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notes_content_gin" ON "notes" USING GIN ("content")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notes_content_gin"`);
    await queryRunner.query(`DROP INDEX "IDX_notes_tags_gin"`);
    await queryRunner.query(`DROP INDEX "IDX_notes_userId_updatedAt"`);
  }
}
