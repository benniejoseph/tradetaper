import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { StripeValidationService } from './subscriptions/services/stripe-validation.service';

@Controller() // Will be prefixed by 'api/v1'
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private readonly stripeValidationService: StripeValidationService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTestMessage(): { message: string } {
    return this.appService.getTestMessage();
  }

  @Get('health')
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    environment: string;
    version: string;
    uptime: number;
    database: string;
    memory: {
      used: string;
      total: string;
      percentage: number;
    };
    services: {
      stripe: boolean;
    };
  }> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      await this.subscriptionRepository.query('SELECT 1');
      
      // Test Stripe connectivity
      let stripeHealthy = false;
      try {
        const healthCheck = await this.stripeValidationService.healthCheck();
        stripeHealthy = healthCheck.healthy;
      } catch (error) {
        // Stripe health check failed
      }

      // Memory usage
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

      const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        database: 'connected',
        memory: {
          used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
          total: `${Math.round(totalMemory / 1024 / 1024)}MB`,
          percentage: memoryPercentage,
        },
        services: {
          stripe: stripeHealthy,
        },
      };

      const duration = Date.now() - startTime;
      
      // Log health check performance
      if (duration > 1000) {
        console.warn(`Health check took ${duration}ms - investigate performance`);
      }

      return healthData;
    } catch (error) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        database: 'error',
        memory: {
          used: 'unknown',
          total: 'unknown',
          percentage: 0,
        },
        services: {
          stripe: false,
        },
      };
    }
  }

  // Removed unsafe raw SQL migration endpoint - use proper TypeORM migrations instead

  // Removed debug subscription endpoint - use proper admin endpoints or logging instead

  // Removed unsafe schema creation endpoint - use proper TypeORM migrations instead

  // Removed unsafe debug users endpoint - use proper admin endpoints or seeding service instead

  // Removed unsafe seed trades endpoint - use proper seeding service instead

  @Post('validate-stripe')
  async validateStripe() {
    try {
      const validationResult = await this.stripeValidationService.validateStripeConfiguration();
      const configSummary = this.stripeValidationService.getConfigurationSummary();
      const healthCheck = await this.stripeValidationService.healthCheck();

      return {
        success: validationResult.isValid,
        validation: validationResult,
        configuration: configSummary,
        health: healthCheck,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Stripe validation error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
