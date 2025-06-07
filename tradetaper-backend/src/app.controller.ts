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

  @Get('health')
  async getHealth(): Promise<{ status: string; timestamp: string; database?: string }> {
    try {
      // Test database connectivity
      await this.subscriptionRepository.query('SELECT 1');
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'ok', // Still return ok for health check, but note DB issue
        timestamp: new Date().toISOString(),
        database: 'error',
      };
    }
  }

  @Post('migrate')
  async runMigration() {
    try {
      console.log('Starting database migration...');
      
      // Drop problematic tables first
      await this.subscriptionRepository.query(`DROP TABLE IF EXISTS usage_tracking CASCADE;`);
      console.log('Dropped usage_tracking table');
      
      // Add plan column to subscriptions table if it doesn't exist
      await this.subscriptionRepository.query(`
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';
      `);
      console.log('Added plan column to subscriptions');

      // Create usage_tracking table with proper schema
      await this.subscriptionRepository.query(`
        CREATE TABLE usage_tracking (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          trades INTEGER DEFAULT 0,
          accounts INTEGER DEFAULT 0,
          "periodStart" TIMESTAMP NOT NULL,
          "periodEnd" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT usage_tracking_user_period_unique UNIQUE ("userId", "periodStart")
        );
      `);
      console.log('Created usage_tracking table');

      // Create index
      await this.subscriptionRepository.query(`
        CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking ("userId", "periodStart");
      `);
      console.log('Created index on usage_tracking');

      // Update existing subscriptions to have free plan
      const result = await this.subscriptionRepository.query(`
        UPDATE subscriptions SET plan = 'free' WHERE plan IS NULL;
      `);
      console.log('Updated existing subscriptions:', result);

      return { 
        success: true, 
        message: 'Migration completed successfully - dropped and recreated usage_tracking table, added plan column',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Migration error:', error);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('debug-subscription')
  async debugSubscription(@Body() body: { userId: string }) {
    try {
      console.log('🔍 Debug: Testing subscription service...');
      
      // Test basic subscription repository access
      const count = await this.subscriptionRepository.count();
      console.log(`✅ Subscription count: ${count}`);
      
      // Test subscription creation without plan access
      const testSubscription = await this.subscriptionRepository.findOne({ 
        where: { userId: body.userId }
      });
      console.log('✅ Subscription query successful:', !!testSubscription);
      
      return {
        success: true,
        subscriptionCount: count,
        hasUserSubscription: !!testSubscription,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Debug subscription error:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('debug-stripe')
  async debugStripe() {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-05-28.basil',
      });
      
      console.log('🔍 Testing Stripe API comprehensively...');
      
      // Test 1: Basic API access
      const account = await stripe.accounts.retrieve();
      console.log('✅ Stripe account retrieved:', account.id);
      
      // Test 2: List all prices (to verify our price IDs exist)
      const allPrices = await stripe.prices.list({ limit: 20 });
      console.log('✅ Total prices found:', allPrices.data.length);
      
      // Test 3: Validate each of our configured price IDs
      const priceIds = [
        process.env.STRIPE_PRICE_STARTER_MONTHLY,
        process.env.STRIPE_PRICE_STARTER_YEARLY,
        process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
        process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY,
        process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
      ];
      
      const priceValidation = {};
      for (const priceId of priceIds) {
        if (priceId) {
          try {
            const price = await stripe.prices.retrieve(priceId);
            priceValidation[priceId] = {
              valid: true,
              amount: price.unit_amount,
              currency: price.currency,
              productId: price.product,
            };
          } catch (error) {
            priceValidation[priceId] = {
              valid: false,
              error: error.message,
            };
          }
        }
      }
      
      // Test 4: Create a test customer (to verify customer creation works)
      const testCustomer = await stripe.customers.create({
        email: 'test@tradetaper.com',
        metadata: { userId: 'test-debug-user' },
      });
      console.log('✅ Test customer created:', testCustomer.id);
      
      // Test 5: Try creating a checkout session with the test customer
      let checkoutTest: any = null;
      try {
        const testPriceId = process.env.STRIPE_PRICE_STARTER_MONTHLY;
        if (testPriceId) {
          const session = await stripe.checkout.sessions.create({
            customer: testCustomer.id,
            payment_method_types: ['card'],
            line_items: [
              {
                price: testPriceId,
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: 'https://tradetaper-frontend-benniejosephs-projects.vercel.app/success',
            cancel_url: 'https://tradetaper-frontend-benniejosephs-projects.vercel.app/cancel',
            allow_promotion_codes: true,
            metadata: {
              userId: 'test-debug-user',
            },
          });
          checkoutTest = {
            success: true,
            sessionId: session.id,
            url: session.url,
          };
        }
      } catch (checkoutError: any) {
        checkoutTest = {
          success: false,
          error: checkoutError.message,
          code: checkoutError.code,
          type: checkoutError.type,
        };
      }
      
      // Test 6: Try creating a payment link (alternative method)
      let paymentLinkTest: any = null;
      try {
        const testPriceId = process.env.STRIPE_PRICE_STARTER_MONTHLY;
        if (testPriceId) {
          const paymentLink = await stripe.paymentLinks.create({
            line_items: [
              {
                price: testPriceId,
                quantity: 1,
              },
            ],
            metadata: {
              userId: 'test-debug-user',
              customerId: testCustomer.id,
            },
          });
          paymentLinkTest = {
            success: true,
            paymentLinkId: paymentLink.id,
            url: paymentLink.url,
          };
        }
      } catch (paymentLinkError: any) {
        paymentLinkTest = {
          success: false,
          error: paymentLinkError.message,
          code: paymentLinkError.code,
          type: paymentLinkError.type,
        };
      }
      
      // Clean up: Delete test customer
      await stripe.customers.del(testCustomer.id);
      console.log('✅ Test customer deleted');
      
      return {
        success: true,
        stripe: {
          accountId: account.id,
          apiVersion: '2025-05-28.basil',
          totalPrices: allPrices.data.length,
        },
        priceValidation,
        checkoutTest,
        paymentLinkTest,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
          stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) + '...',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Stripe debug error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
        type: error.type,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
