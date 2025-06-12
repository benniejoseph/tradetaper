import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('database/tables')
  async getDatabaseTables() {
    return this.adminService.getDatabaseTables();
  }

  @Get('database/columns')
  async getDatabaseColumns(@Query('table') table: string) {
    return this.adminService.getDatabaseColumns(table);
  }

  @Get('database/rows')
  async getDatabaseRows(
    @Query('table') table: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getDatabaseRows(table, page, limit);
  }

  @Get('dashboard-stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('user-analytics')
  async getUserAnalytics(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req,
  ) {
    return this.adminService.getUserAnalytics(timeRange);
  }

  @Get('revenue-analytics')
  async getRevenueAnalytics(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req,
  ) {
    return this.adminService.getRevenueAnalytics(timeRange);
  }

  @Get('trade-analytics')
  async getTradeAnalytics(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req,
  ) {
    return this.adminService.getTradeAnalytics(timeRange);
  }

  @Get('geographic-data')
  async getGeographicData(@Request() req) {
    return this.adminService.getGeographicData();
  }

  @Get('activity-feed')
  async getActivityFeed(
    @Request() req,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ) {
    return this.adminService.getActivityFeed(limit, type);
  }

  @Get('system-health')
  async getSystemHealth(@Request() req) {
    return this.adminService.getSystemHealth();
  }

  @Get('users')
  async getUsers(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Get('top-trading-pairs')
  async getTopTradingPairs(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req,
  ) {
    return this.adminService.getTopTradingPairs(timeRange);
  }

  @Get('subscription-analytics')
  async getSubscriptionAnalytics(
    @Query('timeRange') timeRange: string = '30d',
    @Request() req,
  ) {
    return this.adminService.getSubscriptionAnalytics(timeRange);
  }

  // New endpoints for enhanced admin functionality

  @Get('logs')
  async getLogs(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query('level') level?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getLogs(limit, offset, level, startDate, endDate);
  }

  @Get('logs/stream')
  async getLogsStream(@Request() req) {
    // This would be implemented with Server-Sent Events for real-time logs
    return this.adminService.getLogsStream();
  }

  @Post('test-endpoint')
  async testEndpoint(
    @Body() testData: {
      endpoint: string;
      method: string;
      headers?: Record<string, string>;
      body?: any;
      queryParams?: Record<string, string>;
    },
  ) {
    return this.adminService.testEndpoint(testData);
  }

  @Get('system-diagnostics')
  async getSystemDiagnostics() {
    return this.adminService.getSystemDiagnostics();
  }

  @Post('clear-cache')
  async clearCache(@Body() cacheKeys?: { keys?: string[] }) {
    return this.adminService.clearCache(cacheKeys?.keys);
  }

  @Get('performance-metrics')
  async getPerformanceMetrics(
    @Query('timeRange') timeRange: string = '1h',
  ) {
    return this.adminService.getPerformanceMetrics(timeRange);
  }

  @Get('error-analytics')
  async getErrorAnalytics(
    @Query('timeRange') timeRange: string = '24h',
  ) {
    return this.adminService.getErrorAnalytics(timeRange);
  }

  @Post('debug-session')
  async createDebugSession(@Body() sessionData: { description: string; userId?: string }) {
    return this.adminService.createDebugSession(sessionData);
  }

  @Get('debug-sessions')
  async getDebugSessions() {
    return this.adminService.getDebugSessions();
  }

  @Get('api-usage-stats')
  async getApiUsageStats(
    @Query('timeRange') timeRange: string = '24h',
  ) {
    return this.adminService.getApiUsageStats(timeRange);
  }

  @Post('backup-database')
  async backupDatabase() {
    return this.adminService.backupDatabase();
  }

  @Get('backup-status')
  async getBackupStatus() {
    return this.adminService.getBackupStatus();
  }
}
