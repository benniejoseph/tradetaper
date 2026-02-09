import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKnowledgeBase1768000000000 implements MigrationInterface {
  name = 'AddKnowledgeBase1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable pgvector extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Create Knowledge Documents table
    await queryRunner.query(`
            CREATE TABLE "knowledge_documents" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "filename" character varying NOT NULL,
                "title" text,
                "type" character varying NOT NULL DEFAULT 'text',
                "status" character varying NOT NULL DEFAULT 'processing',
                "errorMessage" text,
                "chunkCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_knowledge_documents" PRIMARY KEY ("id")
            )
        `);

    // Create Vector Embeddings table
    // Note: vector(768) matches Gemini's text-embedding-004 dimension
    await queryRunner.query(`
            CREATE TABLE "vector_embeddings" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "content" text NOT NULL,
                "embedding" vector(768) NOT NULL,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "documentId" uuid,
                CONSTRAINT "PK_vector_embeddings" PRIMARY KEY ("id")
            )
        `);

    // Foreign Key
    await queryRunner.query(`
            ALTER TABLE "vector_embeddings" 
            ADD CONSTRAINT "FK_vector_embeddings_document" 
            FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE
        `);

    // HNSW Index for fast similarity search
    await queryRunner.query(`
            CREATE INDEX "IDX_vector_embedding_hnsw" ON "vector_embeddings" USING hnsw ("embedding" vector_cosine_ops)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_vector_embedding_hnsw"`);
    await queryRunner.query(
      `ALTER TABLE "vector_embeddings" DROP CONSTRAINT "FK_vector_embeddings_document"`,
    );
    await queryRunner.query(`DROP TABLE "vector_embeddings"`);
    await queryRunner.query(`DROP TABLE "knowledge_documents"`);
    // We do not drop the extension to avoid affecting other potential users
  }
}
