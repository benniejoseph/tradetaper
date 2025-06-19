const { Client } = require('pg');

async function forceMigration() {
  // Connect using unix socket for Cloud SQL
  const client = new Client({
    host: '/cloudsql/tradetaper:us-central1:tradetaper-postgres',
    user: 'tradetaper',
    password: 'TradeTaper2024',
    database: 'tradetaper',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%note%'
    `);
    
    console.log('📊 Existing note tables:', tablesResult.rows);

    if (tablesResult.rows.length === 0) {
      console.log('🔄 Creating notes tables...');
      
      // Create notes table
      await client.query(`
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
      console.log('✅ Created notes table');

      // Create note_blocks table
      await client.query(`
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
      console.log('✅ Created note_blocks table');

      // Create note_media table
      await client.query(`
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
      console.log('✅ Created note_media table');

      // Add foreign key constraints
      await client.query(`
        ALTER TABLE "notes" 
        ADD CONSTRAINT "FK_notes_user_id" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await client.query(`
        ALTER TABLE "note_blocks" 
        ADD CONSTRAINT "FK_note_blocks_note_id" 
        FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      `);

      await client.query(`
        ALTER TABLE "note_media" 
        ADD CONSTRAINT "FK_note_media_note_id" 
        FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      `);
      console.log('✅ Added foreign key constraints');

      // Add migration record
      await client.query(`
        INSERT INTO "migrations" ("timestamp", "name") 
        VALUES (1735774000005, 'CreateNotesTable1735774000005')
      `);
      console.log('✅ Added migration record');

      console.log('🎉 Notes migration completed successfully!');
    } else {
      console.log('✅ Notes tables already exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

forceMigration(); 