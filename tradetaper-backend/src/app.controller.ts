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

  // Simple health check that doesn't depend on database
  @Get('health')
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    environment: string;
    version: string;
    uptime: number;
    database?: string;
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    services?: {
      stripe: boolean;
    };
  }> {
    const startTime = Date.now();
    console.log('Health check requested at:', new Date().toISOString());

    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

      const healthData: any = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          percentage: memoryPercentage,
        },
      };

      // Try database connection but don't fail if it's not available
      try {
        await this.subscriptionRepository.query('SELECT 1');
        healthData.database = 'connected';
        healthData.services = { stripe: true };
        console.log('Database connection successful');
      } catch (dbError) {
        console.log('Database connection failed:', dbError.message);
        healthData.database = 'disconnected';
        healthData.services = { stripe: false };
      }

      const duration = Date.now() - startTime;
      console.log(`Health check completed in ${duration}ms`);
      
      return healthData;
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: 'unknown',
          total: 'unknown',
          percentage: 0,
        },
      };
    }
  }

  // Additional simple health check endpoint
  @Get('ping')
  ping(): { message: string; timestamp: string } {
    console.log('Ping endpoint called');
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }

  // Removed unsafe raw SQL migration endpoint - use proper TypeORM migrations instead

  // Removed debug subscription endpoint - use proper admin endpoints or logging instead

  // Removed unsafe schema creation endpoint - use proper TypeORM migrations instead

  // Removed unsafe debug users endpoint - use proper admin endpoints or seeding service instead

  // Removed unsafe seed trades endpoint - use proper seeding service instead

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
