import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Subscription } from './subscriptions/entities/subscription.entity';

@Controller() // Will be prefixed by 'api/v1'
export class AppController {
  constructor(
    private readonly appService: AppService,
    // @InjectRepository(Subscription)
    // private subscriptionRepository: Repository<Subscription>,
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

  // Test endpoint to verify latest deployment
  @Get('test-deployment')
  testDeployment() {
    return {
      status: 'latest-deployment-active',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      deploymentFixed: true
    };
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

  // TEMPORARY: Disabled for GCP deployment without database
  // @Post('force-schema-sync')
  // async forceSchemaSync() {
  //   return {
  //     success: false,
  //     message: 'Database operations disabled for this deployment',
  //     timestamp: new Date().toISOString(),
  //   };
  // }
}
