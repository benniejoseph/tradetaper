"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNotesTable1735774000005 = void 0;
class CreateNotesTable1735774000005 {
    name = 'CreateNotesTable1735774000005';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "account_id" uuid,
        "trade_id" uuid,
        "title" character varying(255) NOT NULL,
        "content" jsonb NOT NULL DEFAULT '[]',
        "tags" text array NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "is_pinned" boolean NOT NULL DEFAULT false,
        "visibility" character varying(20) NOT NULL DEFAULT 'private',
        "word_count" integer NOT NULL DEFAULT 0,
        "reading_time" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_notes" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "note_blocks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "note_id" uuid NOT NULL,
        "block_type" character varying(50) NOT NULL,
        "content" jsonb NOT NULL DEFAULT '{}',
        "position" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_note_blocks" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "note_media" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "note_id" uuid NOT NULL,
        "filename" character varying(255) NOT NULL,
        "original_name" character varying(255) NOT NULL,
        "file_type" character varying(100) NOT NULL,
        "file_size" bigint NOT NULL,
        "gcs_path" character varying(500) NOT NULL,
        "thumbnail_path" character varying(500),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_note_media" PRIMARY KEY ("id")
      )
    `);
        await queryRunner.query(`
      ALTER TABLE "notes" 
      ADD CONSTRAINT "FK_notes_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "notes" 
      ADD CONSTRAINT "FK_notes_account_id" 
      FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "notes" 
      ADD CONSTRAINT "FK_notes_trade_id" 
      FOREIGN KEY ("trade_id") REFERENCES "trades"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "note_blocks" 
      ADD CONSTRAINT "FK_note_blocks_note_id" 
      FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
        await queryRunner.query(`
      ALTER TABLE "note_media" 
      ADD CONSTRAINT "FK_note_media_note_id" 
      FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
        await queryRunner.query(`CREATE INDEX "IDX_notes_user_id" ON "notes" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_account_id" ON "notes" ("account_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_trade_id" ON "notes" ("trade_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_created_at" ON "notes" ("created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_updated_at" ON "notes" ("updated_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_tags" ON "notes" USING gin ("tags")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_title_search" ON "notes" USING gin (to_tsvector('english', "title"))`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_visibility" ON "notes" ("visibility")`);
        await queryRunner.query(`CREATE INDEX "IDX_notes_is_pinned" ON "notes" ("is_pinned")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_blocks_note_id" ON "note_blocks" ("note_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_blocks_position" ON "note_blocks" ("note_id", "position")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_blocks_type" ON "note_blocks" ("block_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_media_note_id" ON "note_media" ("note_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_note_media_file_type" ON "note_media" ("file_type")`);
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION notes_content_search(note_content jsonb) 
      RETURNS text AS $$
      BEGIN
        RETURN (
          SELECT string_agg(
            CASE 
              WHEN block->>'type' = 'text' THEN block->'content'->>'text'
              WHEN block->>'type' = 'heading' THEN block->'content'->>'text'
              WHEN block->>'type' = 'quote' THEN block->'content'->>'text'
              ELSE ''
            END, ' '
          )
          FROM jsonb_array_elements(note_content) AS block
        );
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);
        await queryRunner.query(`
      CREATE INDEX "IDX_notes_content_search" ON "notes" 
      USING gin (to_tsvector('english', notes_content_search("content")))
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP FUNCTION IF EXISTS notes_content_search(jsonb)`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_content_search"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_note_media_file_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_note_media_note_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_note_blocks_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_note_blocks_position"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_note_blocks_note_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_is_pinned"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_visibility"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_title_search"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_tags"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_updated_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_trade_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_account_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notes_user_id"`);
        await queryRunner.query(`ALTER TABLE "note_media" DROP CONSTRAINT "FK_note_media_note_id"`);
        await queryRunner.query(`ALTER TABLE "note_blocks" DROP CONSTRAINT "FK_note_blocks_note_id"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_notes_trade_id"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_notes_account_id"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_notes_user_id"`);
        await queryRunner.query(`DROP TABLE "note_media"`);
        await queryRunner.query(`DROP TABLE "note_blocks"`);
        await queryRunner.query(`DROP TABLE "notes"`);
    }
}
exports.CreateNotesTable1735774000005 = CreateNotesTable1735774000005;
//# sourceMappingURL=1735774000005-CreateNotesTable.js.map