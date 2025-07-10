"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakePasswordNullable1735774000006 = void 0;
class MakePasswordNullable1735774000006 {
    name = 'MakePasswordNullable1735774000006';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
    }
}
exports.MakePasswordNullable1735774000006 = MakePasswordNullable1735774000006;
//# sourceMappingURL=1735774000006-MakePasswordNullable.js.map