/**
 * Stripe Integration Test
 * Quick test to verify Stripe configuration
 */

import Stripe from 'stripe';

async function testStripeIntegration() {
  console.log('🔧 Testing Stripe Integration...');
  
  try {
    // Initialize Stripe with test key (replace with your actual key)
    const stripe = new Stripe('sk_test_your_stripe_secret_key_here', {
      apiVersion: '2025-05-28.basil',
    });

    // Test 1: List payment methods (should return empty array for new account)
    console.log('📋 Testing payment methods...');
    const paymentMethods = await stripe.paymentMethods.list({ limit: 1 });
    console.log('✅ Payment methods API working:', paymentMethods.data.length, 'methods found');

    // Test 2: List products
    console.log('📦 Testing products...');
    const products = await stripe.products.list({ limit: 5 });
    console.log('✅ Products API working:', products.data.length, 'products found');
    
    if (products.data.length > 0) {
      console.log('📦 Available products:');
      products.data.forEach(product => {
        console.log(`  - ${product.name} (${product.id})`);
      });
    }

    // Test 3: List prices
    console.log('💰 Testing prices...');
    const prices = await stripe.prices.list({ limit: 10 });
    console.log('✅ Prices API working:', prices.data.length, 'prices found');
    
    if (prices.data.length > 0) {
      console.log('💰 Available prices:');
      prices.data.forEach(price => {
        const amount = price.unit_amount ? `$${price.unit_amount / 100}` : 'Free';
        const interval = price.recurring ? `/${price.recurring.interval}` : '';
        console.log(`  - ${amount}${interval} (${price.id})`);
      });
    }

    console.log('\n🎉 Stripe integration test completed successfully!');
    console.log('🔗 Stripe Dashboard: https://dashboard.stripe.com/test/dashboard');
    
  } catch (error) {
    console.error('❌ Stripe integration test failed:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n💡 Tips:');
      console.log('1. Make sure you\'re using a valid Stripe test key');
      console.log('2. Get your keys from: https://dashboard.stripe.com/test/apikeys');
      console.log('3. Update the key in your .env file or this test file');
    }
  }
}

// Run the test
testStripeIntegration(); 