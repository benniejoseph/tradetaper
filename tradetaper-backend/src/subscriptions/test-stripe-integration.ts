/**
 * Simple test script to verify Stripe integration
 * Run with: npx ts-node src/subscriptions/test-stripe-integration.ts
 */

import { ConfigService } from '@nestjs/config';
import { StripeService } from './services/stripe.service';

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  // Mock config service
  const configService = {
    get: (key: string) => {
      switch (key) {
        case 'STRIPE_SECRET_KEY':
          return 'sk_test_51HCsYUKCBJK5GhoVRw2fa2u59R2biPCde1MCP2IU8MSz92deeKHrD0FKAReXFeOpqWiN387NoeauU3pFCy3k18sS000AokIvgM';
        case 'STRIPE_WEBHOOK_SECRET':
          return 'whsec_test_secret';
        default:
          return undefined;
      }
    },
  } as ConfigService;

  try {
    const stripeService = new StripeService(configService);
    console.log('✅ StripeService initialized successfully');

    // Test customer creation
    const customer = await stripeService.createCustomer(
      'test@example.com',
      'Test User'
    );
    console.log('✅ Customer created:', customer.id);

    // Test checkout session creation (this will fail without valid price ID)
    try {
      const session = await stripeService.createCheckoutSession(
        'price_test_invalid',
        customer.id,
        'https://example.com/success',
        'https://example.com/cancel'
      );
      console.log('✅ Checkout session created:', session.id);
    } catch (error) {
      console.log('⚠️  Checkout session failed (expected with invalid price):', error.message);
    }

    // Test billing portal session
    try {
      const portalSession = await stripeService.createBillingPortalSession(
        customer.id,
        'https://example.com/return'
      );
      console.log('✅ Billing portal session created:', portalSession.id);
    } catch (error) {
      console.log('⚠️  Billing portal failed:', error.message);
    }

    console.log('\n🎉 Stripe integration test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Create products and prices in Stripe Dashboard');
    console.log('2. Update price IDs in mapPriceIdToTier function');
    console.log('3. Set up webhook endpoint');
    console.log('4. Test with frontend integration');

  } catch (error) {
    console.error('❌ Stripe integration test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your STRIPE_SECRET_KEY environment variable');
    console.log('2. Ensure you have internet connection');
    console.log('3. Verify Stripe account is active');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testStripeIntegration();
} 