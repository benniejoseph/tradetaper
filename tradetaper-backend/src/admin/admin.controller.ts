import { Controller, Get, Query, Param } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
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
}
