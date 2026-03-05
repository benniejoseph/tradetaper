import { MigrationInterface, QueryRunner } from 'typeorm';

export class RepairNotesSearchVectorTrigger1783000000000
  implements MigrationInterface
{
  name = 'RepairNotesSearchVectorTrigger1783000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE notes
      ADD COLUMN IF NOT EXISTS search_vector tsvector
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_notes_search_vector()
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector(
          'english',
          COALESCE(NEW.title, '') || ' ' || notes_content_search(NEW.content)
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trig_update_notes_search_vector ON notes
    `);

    await queryRunner.query(`
      CREATE TRIGGER trig_update_notes_search_vector
      BEFORE INSERT OR UPDATE OF title, content
      ON notes
      FOR EACH ROW
      EXECUTE FUNCTION update_notes_search_vector()
    `);

    await queryRunner.query(`
      UPDATE notes
      SET search_vector = to_tsvector(
        'english',
        COALESCE(title, '') || ' ' || notes_content_search(content)
      )
      WHERE search_vector IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notes_search_vector
      ON notes USING gin(search_vector)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trig_update_notes_search_vector ON notes
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_notes_search_vector()
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_notes_search_vector
    `);
  }
}

