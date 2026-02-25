import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunityReplies1774000000000 implements MigrationInterface {
  name = 'CreateCommunityReplies1774000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_post_replies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "postId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_post_replies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_post_replies_post" FOREIGN KEY ("postId") REFERENCES "community_posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_post_replies_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_community_post_replies_postId_createdAt"
      ON "community_post_replies" ("postId", "createdAt")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_community_post_replies_userId_createdAt"
      ON "community_post_replies" ("userId", "createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_post_replies_userId_createdAt"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_post_replies_postId_createdAt"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "community_post_replies"`);
  }
}
