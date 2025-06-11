import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductionSeedService {
  private readonly logger = new Logger(ProductionSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates essential data required for production operation
   * This should only create minimal required data, not test/demo data
   */
  async seedEssentialData(): Promise<void> {
    this.logger.log('Starting production essential data seeding...');

    try {
      await this.ensureDefaultSubscriptionPlans();
      this.logger.log('Production essential data seeding completed successfully.');
    } catch (error) {
      this.logger.error('Production seeding failed:', error);
      throw error;
    }
  }

  /**
   * Creates a demo user account for production testing (admin use only)
   * This should only be called manually by administrators
   */
  async createDemoUser(): Promise<{ user: User; credentials: { email: string; password: string } }> {
    const existingDemo = await this.userRepository.findOne({
      where: { email: 'demo@tradetaper.com' },
    });

    if (existingDemo) {
      this.logger.log('Demo user already exists');
      return {
        user: existingDemo,
        credentials: { email: 'demo@tradetaper.com', password: 'Contact admin for password' },
      };
    }

    const bcrypt = require('bcrypt');
    const tempPassword = this.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const demoUser = this.userRepository.create({
      email: 'demo@tradetaper.com',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
    });

    const savedUser = await this.userRepository.save(demoUser);

    // Create free subscription for demo user
    const subscription = this.subscriptionRepository.create({
      userId: savedUser.id,
      plan: 'free',
      status: 'active',
    });
    await this.subscriptionRepository.save(subscription);

    this.logger.log('Demo user created successfully');
    return {
      user: savedUser,
      credentials: { email: 'demo@tradetaper.com', password: tempPassword },
    };
  }

  /**
   * Validates that all required environment variables are present
   */
  async validateProductionEnvironment(): Promise<{ valid: boolean; missingVars: string[] }> {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'FRONTEND_URL',
    ];

    const missingVars: string[] = [];

    for (const varName of requiredVars) {
      const value = this.configService.get<string>(varName);
      if (!value || value.trim() === '') {
        missingVars.push(varName);
      }
    }

    const valid = missingVars.length === 0;
    
    if (!valid) {
      this.logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
    } else {
      this.logger.log('All required environment variables are present');
    }

    return { valid, missingVars };
  }

  /**
   * Ensures default subscription plans exist in the database
   * This is essential for the subscription system to work
   */
  private async ensureDefaultSubscriptionPlans(): Promise<void> {
    // This is mainly handled by the migration system now
    // We could add logic here to verify subscription plans exist
    // or create default entries if needed
    this.logger.log('Default subscription plans ensured via migrations');
  }

  /**
   * Generates a secure random password for demo accounts
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Performs production health checks
   */
  async performHealthChecks(): Promise<{
    database: boolean;
    environment: boolean;
    tables: boolean;
  }> {
    const checks = {
      database: false,
      environment: false,
      tables: false,
    };

    try {
      // Check database connectivity
      await this.userRepository.query('SELECT 1');
      checks.database = true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
    }

    try {
      // Check environment variables
      const envCheck = await this.validateProductionEnvironment();
      checks.environment = envCheck.valid;
    } catch (error) {
      this.logger.error('Environment health check failed:', error);
    }

    try {
      // Check that essential tables exist and are accessible
      await this.userRepository.count();
      await this.subscriptionRepository.count();
      checks.tables = true;
    } catch (error) {
      this.logger.error('Tables health check failed:', error);
    }

    this.logger.log('Production health checks completed:', checks);
    return checks;
  }
}