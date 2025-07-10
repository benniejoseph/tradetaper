"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAccountsTable1735774000003 = void 0;
const typeorm_1 = require("typeorm");
class CreateAccountsTable1735774000003 {
    name = 'CreateAccountsTable1735774000003';
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'accounts',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    default: 'gen_random_uuid()',
                },
                {
                    name: 'userId',
                    type: 'uuid',
                    isNullable: false,
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'balance',
                    type: 'decimal',
                    precision: 19,
                    scale: 2,
                    default: '0',
                    isNullable: false,
                },
                {
                    name: 'currency',
                    type: 'varchar',
                    length: '3',
                    default: "'USD'",
                    isNullable: false,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'isActive',
                    type: 'boolean',
                    default: 'true',
                    isNullable: false,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                    isNullable: false,
                },
            ],
            foreignKeys: [
                {
                    columnNames: ['userId'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'CASCADE',
                },
            ],
        }), true);
        await queryRunner.createIndex('accounts', new typeorm_1.TableIndex({
            name: 'IDX_accounts_userId',
            columnNames: ['userId'],
        }));
        await queryRunner.createIndex('accounts', new typeorm_1.TableIndex({
            name: 'IDX_accounts_isActive',
            columnNames: ['isActive'],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('accounts');
    }
}
exports.CreateAccountsTable1735774000003 = CreateAccountsTable1735774000003;
//# sourceMappingURL=1735774000003-CreateAccountsTable.js.map