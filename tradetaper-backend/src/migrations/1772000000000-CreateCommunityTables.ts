import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunityTables1772000000000
  implements MigrationInterface
{
  name = 'CreateCommunityTables1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_settings" (
        "userId" uuid NOT NULL,
        "publicProfile" boolean NOT NULL DEFAULT false,
        "rankingOptIn" boolean NOT NULL DEFAULT true,
        "showMetrics" boolean NOT NULL DEFAULT true,
        "showAccountSizeBand" boolean NOT NULL DEFAULT true,
        "postVisibility" character varying(24) NOT NULL DEFAULT 'public',
        "dmVisibility" character varying(24) NOT NULL DEFAULT 'followers',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_settings_userId" PRIMARY KEY ("userId"),
        CONSTRAINT "FK_community_settings_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" character varying(32) NOT NULL,
        "title" character varying(255),
        "content" text NOT NULL,
        "tags" text,
        "symbol" character varying(50),
        "strategyId" uuid,
        "tradeId" uuid,
        "assetType" character varying(32),
        "timeframe" character varying(16),
        "imageUrl" character varying(1024),
        "visibility" character varying(24) NOT NULL DEFAULT 'public',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_posts_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_community_posts_user_created" ON "community_posts" ("userId", "createdAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_follows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "followerId" uuid NOT NULL,
        "followeeId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_follows" PRIMARY KEY ("id"),
        CONSTRAINT "FK_community_follows_follower" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_follows_followee" FOREIGN KEY ("followeeId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_community_follows_pair" UNIQUE ("followerId", "followeeId")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "community_follows"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_community_posts_user_created"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "community_posts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "community_settings"`);
  }
}
