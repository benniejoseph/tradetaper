/**
 * Stripe Integration Test
 * Quick test to verify Stripe configuration
 */

import Stripe from 'stripe';

// Initialize Stripe with your test secret key
// Make sure to set your actual test key in environment variables
const stripe = new Stripe('sk_test_REPLACE_WITH_YOUR_ACTUAL_STRIPE_TEST_KEY', {
  apiVersion: '2025-05-28.basil',
});

async function testStripeIntegration() {
  try {
    console.log('🧪 Testing Stripe Integration...');

    // Test 1: Create a customer
    console.log('\n1. Creating test customer...');
    const customer = await stripe.customers.create({
      email: 'test@tradetaper.com',
      name: 'Test User',
    });
    console.log('✅ Customer created:', customer.id);

    // Test 2: Create a price
    console.log('\n2. Creating test price...');
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: 997, // $9.97
      recurring: {
        interval: 'month',
      },
      product_data: {
        name: 'TradeTaper Pro Monthly',
      },
    });
    console.log('✅ Price created:', price.id);

    // Test 3: Create a test subscription (payment method required for real subscription)
    console.log('\n3. Testing checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'https://yourdomain.com/success',
      cancel_url: 'https://yourdomain.com/cancel',
    });
    console.log('✅ Checkout session created:', session.id);

    // Cleanup
    console.log('\n4. Cleaning up test data...');
    await stripe.customers.del(customer.id);
    console.log('✅ Test customer deleted');

    console.log(
      '\n🎉 All tests passed! Stripe integration is working correctly.',
    );
  } catch (error) {
    console.error('❌ Error testing Stripe integration:', error);
  }
}

// Run the test
testStripeIntegration();
