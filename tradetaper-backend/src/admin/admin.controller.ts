import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Delete,
  Body,
  UnauthorizedException,
  UseGuards,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { TestUserSeedService } from '../seed/test-user-seed.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Public } from '../auth/decorators/public.decorator';
import {
  AuthRateLimit,
  RateLimitGuard,
} from '../common/guards/rate-limit.guard';

@Controller('admin')
@UseGuards(AdminGuard, RateLimitGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly testUserSeedService: TestUserSeedService,
    private readonly jwtService: JwtService,
  ) {}

  // ─── Admin Auth ─────────────────────────────────────────────────────────
  @Public()
  @Post('auth/login')
  @AuthRateLimit()
  async adminLogin(@Body() body: { email: string; password: string }) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      throw new InternalServerErrorException(
        'Admin credentials are not configured',
      );
    }

    if (body.email !== adminEmail || body.password !== adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload = { sub: 'admin-user-id', email: body.email, role: 'admin' };
    const token = this.jwtService.sign(payload, { expiresIn: '30d' });
    return { access_token: token, role: 'admin' };
  }

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
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(parseInt(page), parseInt(limit), search);
  }

  @Get('users/:id')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Get('trades')
  async getTrades(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getTrades(parseInt(page), parseInt(limit), status, userId);
  }

  @Get('accounts')
  async getAccounts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAccounts(parseInt(page), parseInt(limit), userId);
  }

  @Get('subscriptions')
  async getSubscriptions(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: string,
    @Query('plan') plan?: string,
  ) {
    return this.adminService.getSubscriptions(parseInt(page), parseInt(limit), status, plan);
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
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getDatabaseRows(
      table,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Post('seed-sample-data')
  async seedSampleData() {
    this.ensureDangerousOperationsAllowed();
    return this.adminService.seedSampleData();
  }

  @Post('test-user/create')
  async createTestUser() {
    this.ensureDangerousOperationsAllowed();
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
    this.ensureDangerousOperationsAllowed();
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
    this.ensureDangerousOperationsAllowed();
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
    this.ensureDangerousOperationsAllowed();
    if (
      confirm !== 'DELETE_ALL_DATA' ||
      doubleConfirm !== 'I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING'
    ) {
      return {
        error: 'Double safety confirmation required',
        message:
          'Add query parameters: ?confirm=DELETE_ALL_DATA&doubleConfirm=I_UNDERSTAND_THIS_WILL_DELETE_EVERYTHING',
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

  @Post('database/run-sql')
  async runSql(
    @Query('confirm') confirm: string,
    @Body() body: { sql: string },
  ) {
    this.ensureDangerousOperationsAllowed();
    if (confirm !== 'ADMIN_SQL_EXECUTE') {
      return {
        error: 'Safety confirmation required',
        message: 'Add query parameter: ?confirm=ADMIN_SQL_EXECUTE',
      };
    }

    return this.adminService.runSql(body.sql);
  }

  private ensureDangerousOperationsAllowed() {
    if (process.env.ALLOW_ADMIN_DANGEROUS_OPERATIONS !== 'true') {
      throw new ForbiddenException(
        'Dangerous admin operations are disabled in this environment',
      );
    }
  }
}
