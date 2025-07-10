"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMT5AccountsTable1735774000002 = void 0;
const typeorm_1 = require("typeorm");
class CreateMT5AccountsTable1735774000002 {
    name = 'CreateMT5AccountsTable1735774000002';
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'mt5_accounts',
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
                    name: 'accountName',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'server',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'login',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'password',
                    type: 'varchar',
                    length: '255',
                    isNullable: false,
                },
                {
                    name: 'isActive',
                    type: 'boolean',
                    default: 'true',
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
                    name: 'accountType',
                    type: 'varchar',
                    length: '255',
                    isNullable: true,
                },
                {
                    name: 'currency',
                    type: 'varchar',
                    length: '3',
                    default: "'USD'",
                    isNullable: true,
                },
                {
                    name: 'lastSyncAt',
                    type: 'timestamp with time zone',
                    isNullable: true,
                },
                {
                    name: 'syncAttempts',
                    type: 'integer',
                    default: '0',
                    isNullable: false,
                },
                {
                    name: 'lastSyncErrorAt',
                    type: 'timestamp with time zone',
                    isNullable: true,
                },
                {
                    name: 'lastSyncError',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    default: "'{}'",
                    isNullable: true,
                },
                {
                    name: 'totalTradesImported',
                    type: 'integer',
                    default: '0',
                    isNullable: false,
                },
                {
                    name: 'autoSyncEnabled',
                    type: 'boolean',
                    default: 'true',
                    isNullable: false,
                },
                {
                    name: 'lastKnownIp',
                    type: 'varchar',
                    length: '45',
                    isNullable: true,
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
        await queryRunner.createIndex('mt5_accounts', new typeorm_1.TableIndex({
            name: 'IDX_mt5_accounts_userId',
            columnNames: ['userId'],
        }));
        await queryRunner.createIndex('mt5_accounts', new typeorm_1.TableIndex({
            name: 'IDX_mt5_accounts_server_login',
            columnNames: ['server', 'login'],
        }));
        await queryRunner.createIndex('mt5_accounts', new typeorm_1.TableIndex({
            name: 'IDX_mt5_accounts_isActive',
            columnNames: ['isActive'],
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropTable('mt5_accounts');
    }
}
exports.CreateMT5AccountsTable1735774000002 = CreateMT5AccountsTable1735774000002;
//# sourceMappingURL=1735774000002-CreateMT5AccountsTable.js.map