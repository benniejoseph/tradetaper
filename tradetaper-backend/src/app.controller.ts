import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AppDataSource } from './database/data-source';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Subscription } from './subscriptions/entities/subscription.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource() private dataSource: DataSource,
    // TEMPORARY: Disable subscription repository for initial admin deployment
    // @InjectRepository(Subscription)
    // private subscriptionRepository: Repository<Subscription>,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTestMessage(): { message: string } {
    return { message: 'TradeTaper Backend API is running!' };
  }

  @Get('ping')
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        url: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
        type: 'PostgreSQL'
      },
      deployment: {
        platform: 'Google Cloud Run',
        region: 'us-central1'
      }
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  @Get('test-deployment')
  testDeployment() {
    return {
      message: 'TradeTaper Backend deployed successfully!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: [
        'User Management',
        'Trade Tracking',
        'Admin Dashboard',
        'Database Integration'
      ]
    };
  }

  @Get('railway-health')
  railwayHealth() {
    return {
      status: 'ok',
      message: 'TradeTaper Backend is running on Railway',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Post('validate-stripe')
  async validateStripe() {
    // Placeholder for Stripe validation
    return {
      message: 'Stripe validation endpoint',
      status: 'not_implemented'
    };
  }

  @Get('migrate')
  async runMigrationsGet() {
    try {
      console.log('🔄 Running database migrations...');
      const migrations = await this.dataSource.runMigrations();
      
      return {
        success: true,
        message: `Successfully ran ${migrations.length} migrations`,
        migrations: migrations.map(m => m.name),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        message: 'Migration failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('run-migrations')
  async runMigrations() {
    try {
      console.log('🔄 Running database migrations...');
      const migrations = await this.dataSource.runMigrations();
      
      return {
        success: true,
        message: `Successfully ran ${migrations.length} migrations`,
        migrations: migrations.map(m => m.name),
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        message: 'Migration failed',
        error: error.message,
      };
    }
  }
}
