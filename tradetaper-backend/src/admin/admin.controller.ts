import { Controller, Get, Query, Param, Post, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { TestUserSeedService } from '../seed/test-user-seed.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly testUserSeedService: TestUserSeedService,
  ) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('user-analytics/:timeRange')
  async getUserAnalytics(@Param('timeRange') timeRange: string) {
    return this.adminService.getUserAnalytics(timeRange);
  }

  @Get('revenue-analytics/:timeRange')
  async getRevenueAnalytics(@Param('timeRange') timeRange: string) {
    return this.adminService.getRevenueAnalytics(timeRange);
  }

  @Get('system-health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('activity-feed')
  async getActivityFeed(@Query('limit') limit: string = '5') {
    return this.adminService.getActivityFeed(parseInt(limit));
  }

  @Get('users')
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.adminService.getUsers(parseInt(page), parseInt(limit));
  }

  @Get('trades')
  async getTrades(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    return this.adminService.getTrades(parseInt(page), parseInt(limit));
  }

  @Get('database/tables')
  async getDatabaseTables() {
    return this.adminService.getDatabaseTables();
  }

  @Get('database/table/:table')
  async getDatabaseTable(@Param('table') table: string) {
    return this.adminService.getDatabaseTable(table);
  }

  @Get('database/columns/:table')
  async getDatabaseColumns(@Param('table') table: string) {
    return this.adminService.getDatabaseColumns(table);
  }

  @Get('database/rows/:table')
  async getDatabaseRows(
    @Param('table') table: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.adminService.getDatabaseRows(table, parseInt(page), parseInt(limit));
  }

  @Post('seed-sample-data')
  async seedSampleData() {
    return this.adminService.seedSampleData();
  }

  @Post('test-user/create')
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

  @Delete('test-user/delete')
  async deleteTestUser() {
    await this.testUserSeedService.deleteTestUser();
    return {
      message: 'Test user deleted successfully',
    };
  }

  @Delete('database/clear-table/:tableName')
  async clearTable(
    @Param('tableName') tableName: string,
    @Query('confirm') confirm: string,
  ) {
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

  @Delete('database/clear-all-tables')
  async clearAllTables(
    @Query('confirm') confirm: string,
    @Query('doubleConfirm') doubleConfirm: string,
  ) {
    if (confirm !== 'DELETE_ALL_DATA' || doubleConfirm !== 'I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING') {
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

  @Get('database/table-stats')
  async getTableStats() {
    return this.adminService.getTableStats();
  }
}
