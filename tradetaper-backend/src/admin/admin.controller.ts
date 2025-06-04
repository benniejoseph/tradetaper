import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
} 