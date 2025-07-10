import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakePasswordNullable1735774000006 implements MigrationInterface {
  name = 'MakePasswordNullable1735774000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make password column nullable to support OAuth users
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: This down migration might fail if there are users with null passwords
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`,
    );
  }
}
