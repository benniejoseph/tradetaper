import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRazorpayToSubscriptions1770500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('subscriptions', [
      new TableColumn({
        name: 'razorpayCustomerId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'razorpaySubscriptionId',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'razorpayPlanId',
        type: 'varchar',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('subscriptions', [
      'razorpayCustomerId',
      'razorpaySubscriptionId',
      'razorpayPlanId',
    ]);
  }
}
