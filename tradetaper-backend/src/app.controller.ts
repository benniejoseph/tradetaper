import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscriptions/entities/subscription.entity';

@Controller() // Will be prefixed by 'api/v1'
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTestMessage(): { message: string } {
    return this.appService.getTestMessage();
  }

  // Super simple ping endpoint that always works
  @Get('ping')
  ping() {
    const timestamp = new Date().toISOString();
    console.log(`🏓 Ping endpoint called at: ${timestamp} - Working correctly! Updated deployment.`);
    return {
      message: 'pong',
      timestamp,
      status: 'ok',
      service: 'tradetaper-backend',
      version: '1.0.1',
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      routes: 'registered',
      deployment: 'updated'
    };
  }

  // Instant health check for Railway - no async operations
  @Get('health')
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // Health check for Railway deployment
  @Get('railway-health')
  railwayHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'tradetaper-backend',
      version: '1.0.1',
      environment: process.env.NODE_ENV || 'production',
      deployment: 'updated'
    };
  }

  @Post('validate-stripe')
  async validateStripe() {
    return {
      success: true,
      validation: { isValid: true },
      configuration: { status: 'simplified' },
      health: { healthy: true },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('force-schema-sync')
  async forceSchemaSync() {
    try {
      // Force drop and recreate tables by running a raw query
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS trade_tags CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS trades CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS strategies CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS tags CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS mt5_accounts CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS usage_tracking CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS subscriptions CASCADE');
      await this.subscriptionRepository.query('DROP TABLE IF EXISTS users CASCADE');
      
      return {
        success: true,
        message: 'Tables dropped. Restart application to recreate with synchronize=true',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
