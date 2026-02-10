import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRazorpayToSubscriptions1770500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('subscriptions');

    const columnsToAdd: TableColumn[] = [];

    // Check each column before adding
    if (!table?.findColumnByName('razorpayCustomerId')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'razorpayCustomerId',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    if (!table?.findColumnByName('razorpaySubscriptionId')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'razorpaySubscriptionId',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    if (!table?.findColumnByName('razorpayPlanId')) {
      columnsToAdd.push(
        new TableColumn({
          name: 'razorpayPlanId',
          type: 'varchar',
          isNullable: true,
        })
      );
    }

    if (columnsToAdd.length > 0) {
      await queryRunner.addColumns('subscriptions', columnsToAdd);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('subscriptions', [
      'razorpayCustomerId',
      'razorpaySubscriptionId',
      'razorpayPlanId',
    ]);
  }
}
