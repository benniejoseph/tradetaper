"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTargetToAccounts1735774000004 = void 0;
const typeorm_1 = require("typeorm");
class AddTargetToAccounts1735774000004 {
    name = 'AddTargetToAccounts1735774000004';
    async up(queryRunner) {
        await queryRunner.addColumn('accounts', new typeorm_1.TableColumn({
            name: 'target',
            type: 'decimal',
            precision: 19,
            scale: 2,
            default: '0',
            isNullable: false,
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn('accounts', 'target');
    }
}
exports.AddTargetToAccounts1735774000004 = AddTargetToAccounts1735774000004;
//# sourceMappingURL=1735774000004-AddTargetToAccounts.js.map