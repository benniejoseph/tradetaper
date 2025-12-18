"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const test_user_seed_service_1 = require("../seed/test-user-seed.service");
let AdminController = class AdminController {
    adminService;
    testUserSeedService;
    constructor(adminService, testUserSeedService) {
        this.adminService = adminService;
        this.testUserSeedService = testUserSeedService;
    }
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }
    async getUserAnalytics(timeRange) {
        return this.adminService.getUserAnalytics(timeRange);
    }
    async getRevenueAnalytics(timeRange) {
        return this.adminService.getRevenueAnalytics(timeRange);
    }
    async getSystemHealth() {
        return this.adminService.getSystemHealth();
    }
    async getActivityFeed(limit = '5') {
        return this.adminService.getActivityFeed(parseInt(limit));
    }
    async getUsers(page = '1', limit = '20') {
        return this.adminService.getUsers(parseInt(page), parseInt(limit));
    }
    async getTrades(page = '1', limit = '50') {
        return this.adminService.getTrades(parseInt(page), parseInt(limit));
    }
    async getAccounts(page = '1', limit = '50') {
        return this.adminService.getAccounts(parseInt(page), parseInt(limit));
    }
    async getDatabaseTables() {
        return this.adminService.getDatabaseTables();
    }
    async getDatabaseTable(table) {
        return this.adminService.getDatabaseTable(table);
    }
    async getDatabaseColumns(table) {
        return this.adminService.getDatabaseColumns(table);
    }
    async getDatabaseRows(table, page = '1', limit = '20') {
        return this.adminService.getDatabaseRows(table, parseInt(page), parseInt(limit));
    }
    async seedSampleData() {
        return this.adminService.seedSampleData();
    }
    async createTestUser() {
        const result = await this.testUserSeedService.createTestUser();
        return {
            message: 'Test user created successfully',
            user: {
                id: result.user.id,
                email: result.user.email,
                firstName: result.user.firstName,
                lastName: result.user.lastName,
            },
            stats: result.stats,
        };
    }
    async deleteTestUser() {
        await this.testUserSeedService.deleteTestUser();
        return {
            message: 'Test user deleted successfully',
        };
    }
    async clearTable(tableName, confirm) {
        if (confirm !== 'DELETE_ALL_DATA') {
            return {
                error: 'Safety confirmation required',
                message: 'Add query parameter: ?confirm=DELETE_ALL_DATA',
            };
        }
        const result = await this.adminService.clearTable(tableName);
        return {
            message: `Table ${tableName} cleared successfully`,
            deletedCount: result.deletedCount,
        };
    }
    async clearAllTables(confirm, doubleConfirm) {
        if (confirm !== 'DELETE_ALL_DATA' ||
            doubleConfirm !== 'I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING') {
            return {
                error: 'Double safety confirmation required',
                message: 'Add query parameters: ?confirm=DELETE_ALL_DATA&doubleConfirm=I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING',
            };
        }
        const result = await this.adminService.clearAllTables();
        return {
            message: 'All tables cleared successfully',
            tablesCleared: result.tablesCleared,
            totalDeleted: result.totalDeleted,
        };
    }
    async getTableStats() {
        return this.adminService.getTableStats();
    }
    async runSql(confirm, body) {
        if (confirm !== 'ADMIN_SQL_EXECUTE') {
            return {
                error: 'Safety confirmation required',
                message: 'Add query parameter: ?confirm=ADMIN_SQL_EXECUTE',
            };
        }
        return this.adminService.runSql(body.sql);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('user-analytics/:timeRange'),
    __param(0, (0, common_1.Param)('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)('revenue-analytics/:timeRange'),
    __param(0, (0, common_1.Param)('timeRange')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)('system-health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('activity-feed'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getActivityFeed", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('trades'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTrades", null);
__decorate([
    (0, common_1.Get)('accounts'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAccounts", null);
__decorate([
    (0, common_1.Get)('database/tables'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDatabaseTables", null);
__decorate([
    (0, common_1.Get)('database/table/:table'),
    __param(0, (0, common_1.Param)('table')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDatabaseTable", null);
__decorate([
    (0, common_1.Get)('database/columns/:table'),
    __param(0, (0, common_1.Param)('table')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDatabaseColumns", null);
__decorate([
    (0, common_1.Get)('database/rows/:table'),
    __param(0, (0, common_1.Param)('table')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDatabaseRows", null);
__decorate([
    (0, common_1.Post)('seed-sample-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "seedSampleData", null);
__decorate([
    (0, common_1.Post)('test-user/create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTestUser", null);
__decorate([
    (0, common_1.Delete)('test-user/delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteTestUser", null);
__decorate([
    (0, common_1.Delete)('database/clear-table/:tableName'),
    __param(0, (0, common_1.Param)('tableName')),
    __param(1, (0, common_1.Query)('confirm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "clearTable", null);
__decorate([
    (0, common_1.Delete)('database/clear-all-tables'),
    __param(0, (0, common_1.Query)('confirm')),
    __param(1, (0, common_1.Query)('doubleConfirm')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "clearAllTables", null);
__decorate([
    (0, common_1.Get)('database/table-stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTableStats", null);
__decorate([
    (0, common_1.Post)('database/run-sql'),
    __param(0, (0, common_1.Query)('confirm')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "runSql", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        test_user_seed_service_1.TestUserSeedService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map