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
      
      // Create users table first
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "firstName" VARCHAR(100),
          "lastName" VARCHAR(100),
          "lastLoginAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Add lastLoginAt column if it doesn't exist
      await this.subscriptionRepository.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP;
      `);
      console.log('✅ Users table created');

      // Create trades table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS trades (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          symbol VARCHAR(50) NOT NULL,
          side VARCHAR(10) NOT NULL,
          quantity DECIMAL(15,8) NOT NULL,
          "openPrice" DECIMAL(15,8),
          "closePrice" DECIMAL(15,8),
          "openTime" TIMESTAMP,
          "closeTime" TIMESTAMP,
          pnl DECIMAL(15,2),
          commission DECIMAL(15,2),
          swap DECIMAL(15,2),
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Trades table created');

      // Create mt5_accounts table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS mt5_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "accountId" VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          server VARCHAR(255),
          login VARCHAR(255),
          password VARCHAR(255),
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ MT5 accounts table created');

      // Create tags table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          color VARCHAR(7),
          "userId" UUID NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Tags table created');
      
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

      // Create sample trades for testing
      const testUserId = '0eb6dc08-f35a-4eca-bb55-08df3b05320d'; // logintest@example.com
      
      // Check if test data already exists
      const existingTrades = await this.subscriptionRepository.query(`
        SELECT COUNT(*) as count FROM trades WHERE "userId" = $1;
      `, [testUserId]);
      
      if (parseInt(existingTrades[0].count) === 0) {
        console.log('Creating sample trades for testing...');
        
        const sampleTrades = [
          {
            userId: testUserId,
            assetType: 'Forex',
            symbol: 'EURUSD',
            direction: 'Long',
            status: 'Closed',
            entryDate: '2025-06-01T10:00:00Z',
            entryPrice: 1.1250,
            exitDate: '2025-06-01T15:30:00Z',
            exitPrice: 1.1320,
            quantity: 10000,
            commission: 5.50,
            notes: 'Good breakout trade on EURUSD'
          },
          {
            userId: testUserId,
            assetType: 'Forex',
            symbol: 'GBPUSD',
            direction: 'Short',
            status: 'Closed',
            entryDate: '2025-06-02T08:00:00Z',
            entryPrice: 1.2650,
            exitDate: '2025-06-02T12:00:00Z',
            exitPrice: 1.2580,
            quantity: 15000,
            commission: 7.25,
            notes: 'Nice pullback trade'
          },
          {
            userId: testUserId,
            assetType: 'Crypto',
            symbol: 'BTCUSD',
            direction: 'Long',
            status: 'Open',
            entryDate: '2025-06-05T14:00:00Z',
            entryPrice: 45000,
            quantity: 0.1,
            commission: 15.00,
            notes: 'Long term Bitcoin position'
          }
        ];

        for (const trade of sampleTrades) {
          await this.subscriptionRepository.query(`
            INSERT INTO trades (
              "userId", "assetType", symbol, direction, status, "entryDate", "entryPrice", 
              "exitDate", "exitPrice", quantity, commission, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);
          `, [
            trade.userId, trade.assetType, trade.symbol, trade.direction, trade.status,
            trade.entryDate, trade.entryPrice, trade.exitDate, trade.exitPrice,
            trade.quantity, trade.commission, trade.notes
          ]);
        }
        console.log('✅ Sample trades created');
      } else {
        console.log('✅ Sample trades already exist');
      }

      return { 
        success: true, 
        message: 'Migration completed successfully - created all tables, sample trades, dropped and recreated usage_tracking table, added plan column',
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

  @Post('create-schema')
  async createSchema() {
    try {
      console.log('🔍 Creating database schema...');
      
      // Create users table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          "firstName" VARCHAR(100),
          "lastName" VARCHAR(100),
          "lastLoginAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Users table created');

      // Create trades table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS trades (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          symbol VARCHAR(50) NOT NULL,
          side VARCHAR(10) NOT NULL,
          quantity DECIMAL(15,8) NOT NULL,
          "openPrice" DECIMAL(15,8),
          "closePrice" DECIMAL(15,8),
          "openTime" TIMESTAMP,
          "closeTime" TIMESTAMP,
          pnl DECIMAL(15,2),
          commission DECIMAL(15,2),
          swap DECIMAL(15,2),
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Trades table created');

      // Create mt5_accounts table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS mt5_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          "accountId" VARCHAR(255) NOT NULL,
          name VARCHAR(255),
          server VARCHAR(255),
          login VARCHAR(255),
          password VARCHAR(255),
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ MT5 accounts table created');

      // Create tags table
      await this.subscriptionRepository.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL,
          color VARCHAR(7),
          "userId" UUID NOT NULL,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Tags table created');

      // Subscriptions table should already exist from migration
      console.log('✅ Schema creation completed');

      return {
        success: true,
        message: 'All database tables created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Schema creation error:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('debug-users')
  async debugUsers() {
    try {
      console.log('🔍 Testing user creation with proper password hashing...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('testpassword123', 10);
      
      // First delete any existing test user
      await this.subscriptionRepository.query(`
        DELETE FROM users WHERE email = 'logintest@example.com';
      `);
      
      // Test direct SQL user creation with hashed password
      const testUserId = await this.subscriptionRepository.query(`
        INSERT INTO users (email, password, "firstName", "lastName") 
        VALUES ('logintest@example.com', $1, 'Login', 'Test') 
        RETURNING id;
      `, [hashedPassword]);
      console.log('✅ Direct SQL user creation with hashed password:', testUserId);

      // Test user query
      const users = await this.subscriptionRepository.query(`
        SELECT id, email, "firstName", "lastName", "createdAt" FROM users;
      `);
      console.log('✅ Users in database:', users.length);

      // Create sample trades for testing
      const userId = '0eb6dc08-f35a-4eca-bb55-08df3b05320d';
      await this.subscriptionRepository.query(`
        INSERT INTO trades ("userId", "assetType", symbol, direction, status, "entryDate", "entryPrice", "exitDate", "exitPrice", quantity, commission, notes)
        VALUES 
        ($1, 'Forex', 'EURUSD', 'Long', 'Closed', '2025-06-01T10:00:00Z', 1.1250, '2025-06-01T15:30:00Z', 1.1320, 10000, 5.50, 'Good breakout trade'),
        ($1, 'Forex', 'GBPUSD', 'Short', 'Closed', '2025-06-02T08:00:00Z', 1.2650, '2025-06-02T12:00:00Z', 1.2580, 15000, 7.25, 'Nice pullback trade'),
        ($1, 'Crypto', 'BTCUSD', 'Long', 'Open', '2025-06-05T14:00:00Z', 45000, NULL, NULL, 0.1, 15.00, 'Long term Bitcoin position')
        ON CONFLICT DO NOTHING;
      `, [userId]);

      return {
        success: true,
        testUserId: testUserId[0],
        userCount: users.length,
        testCredentials: {
          email: 'logintest@example.com',
          password: 'testpassword123'
        },
        tradesCreated: 'Sample trades created',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Debug users error:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };
    }
  }


  @Post('seed-trades')
  async seedTrades(@Body() body?: { userId?: string }) {
    try {
      const testUserId = body?.userId || '0eb6dc08-f35a-4eca-bb55-08df3b05320d';
      console.log('🔍 Creating test trades for user:', testUserId);
      
      // Create sample trades
      const sampleTrades = [
        {
          userId: testUserId,
          assetType: 'Forex',
          symbol: 'EURUSD',
          direction: 'Long',
          status: 'Closed',
          entryDate: '2025-06-01T10:00:00Z',
          entryPrice: 1.1250,
          exitDate: '2025-06-01T15:30:00Z',
          exitPrice: 1.1320,
          quantity: 10000,
          commission: 5.50,
          notes: 'Good breakout trade on EURUSD',
          stopLoss: 1.1200,
          takeProfit: 1.1350
        },
        {
          userId: testUserId,
          assetType: 'Forex',
          symbol: 'GBPUSD',
          direction: 'Short',
          status: 'Closed',
          entryDate: '2025-06-02T08:00:00Z',
          entryPrice: 1.2650,
          exitDate: '2025-06-02T12:00:00Z',
          exitPrice: 1.2580,
          quantity: 15000,
          commission: 7.25,
          notes: 'Nice pullback trade',
          stopLoss: 1.2700,
          takeProfit: 1.2550
        },
        {
          userId: testUserId,
          assetType: 'Crypto',
          symbol: 'BTCUSD',
          direction: 'Long',
          status: 'Open',
          entryDate: '2025-06-05T14:00:00Z',
          entryPrice: 45000,
          quantity: 0.1,
          commission: 15.00,
          notes: 'Long term Bitcoin position',
          stopLoss: 42000,
          takeProfit: 50000
        }
      ];

      const createdTrades: any[] = [];
      for (const trade of sampleTrades) {
        const result = await this.subscriptionRepository.query(`
          INSERT INTO trades (
            "userId", "assetType", symbol, direction, status, "entryDate", "entryPrice", 
            "exitDate", "exitPrice", quantity, commission, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, symbol, direction, "entryPrice", "exitPrice", quantity;
        `, [
          trade.userId, trade.assetType, trade.symbol, trade.direction, trade.status,
          trade.entryDate, trade.entryPrice, trade.exitDate, trade.exitPrice,
          trade.quantity, trade.commission, trade.notes
        ]);
        createdTrades.push(result[0]);
      }

      return {
        success: true,
        message: 'Test data created successfully',
        createdTrades,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Create test data error:', error);
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
