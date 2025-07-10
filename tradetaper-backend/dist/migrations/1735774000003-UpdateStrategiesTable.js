"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStrategiesTable1735774000003 = void 0;
class UpdateStrategiesTable1735774000003 {
    name = 'UpdateStrategiesTable1735774000003';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "rules"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "riskProfile"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "timeframes"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "markets"`);
        try {
            await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN IF NOT EXISTS "checklist" json`);
        }
        catch (e) {
            console.log('checklist column may already exist');
        }
        try {
            await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN IF NOT EXISTS "tradingSession" varchar(50)`);
        }
        catch (e) {
            console.log('tradingSession column may already exist');
        }
        try {
            await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true`);
        }
        catch (e) {
            console.log('isActive column may already exist');
        }
        try {
            await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN IF NOT EXISTS "color" varchar(7) DEFAULT '#3B82F6'`);
        }
        catch (e) {
            console.log('color column may already exist');
        }
        try {
            await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN IF NOT EXISTS "tags" text`);
        }
        catch (e) {
            console.log('tags column may already exist');
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "checklist"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "tradingSession"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "isActive"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "color"`);
        await queryRunner.query(`ALTER TABLE "strategies" DROP COLUMN IF EXISTS "tags"`);
        await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN "rules" text`);
        await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN "riskProfile" varchar(50)`);
        await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN "timeframes" varchar(255)`);
        await queryRunner.query(`ALTER TABLE "strategies" ADD COLUMN "markets" varchar(255)`);
    }
}
exports.UpdateStrategiesTable1735774000003 = UpdateStrategiesTable1735774000003;
//# sourceMappingURL=1735774000003-UpdateStrategiesTable.js.map